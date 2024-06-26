const bcrypt = require('bcrypt');
const Employee = require('../model/Employee.model');
const jwt = require('jsonwebtoken');
const { verifyGoogleToken } = require('../middleware/middlewareController');
const { checkEmp } = require('../controllers/emp.controller');
const SALT_WORK_FACTOR = 10;


const authController = {
	//REGISTER IS ADD USER IN CONTROLLER

	//GENERATE ACCESS TOKEN
	generateAccessToken: (user) => {
		return jwt.sign(
			{
				id: user.id,
				admin: user.admin,
			},
			process.env.JWT_ACCESS_KEY,
			{ expiresIn: '7d' }
		);
	},

	//GENERATE REFRESH TOKEN
	generateRefreshToken: (user) => {
		return jwt.sign(
			{
				id: user.id,
				admin: user.admin,
			},
			process.env.JWT_REFRESH_KEY,
			{ expiresIn: '365d' }
		);
	},

	//COMPARE PASSWORD
	comparePassword: async (req, res) => {
		try {
			const user = await Employee.findOne({ phoneNumber: req.body.phoneNumber });
			const validPassword = await bcrypt.compare(req.body.password, user.password);
			res.json(validPassword);
		} catch (error) {
			res.status(500).json(error);
		}
	},
	loginGoogle: async (req, res) => {
		try {
			if (req.body.credential) {
				const verificationResponse = await verifyGoogleToken(req.body.credential);
				if (verificationResponse.error) {
					return res.status(400).json({
						message: verificationResponse.error,
					});
				}
				const profile = verificationResponse?.payload;

				const user = await checkEmp(profile);
				const token = authController.createToken(user, res);
				res.status(200).json(token);
			}
		} catch (error) {
			res.status(500).json(error);
		}
	},

	//LOGIN
	loginUser: async (req, res) => {
		try {
			const user = await Employee.findOne({ username: req.body.username });
			if (!user) {
				return res.status(401).json({ error: 'Invalid username or password' });
			}

			if (user.is_deleted) {
				return res.status(403).json({
					error: 'Your account has been deleted and is no longer accessible. Please contact the administrator for more information.',
				});
			}

			const validPassword = await bcrypt.compare(req.body.password, user.password);

			if (!validPassword) {
				return res.status(401).json({ error: 'Invalid username or password' });
			}

			if (user && validPassword) {
				const accessToken = authController.generateAccessToken(user);
				const refreshToken = authController.generateRefreshToken(user);

				// create refresh token in database
				user.updateOne({ refreshToken: refreshToken });

				res.cookie('refreshToken', refreshToken, {
					// create cookie with refresh token that expires in 7 days
					httpOnly: true,
					expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
					secure: true,
					path: '/',
					sameSite: 'none',
				});
				const { password, ...others } = user._doc;
				res.status(200).json({ ...others, accessToken, refreshToken });
			}
		} catch (error) {
			res.status(500).json(error);
		}
	},

	//REDIS
	requestRefreshToken: async (req, res) => {
		//Take refresh token from user
		const refreshTokenCookies = req.cookies.refreshToken;
		const refreshTokenUser = req.body.refreshToken;
		//Send error if token is not valid
		if (!refreshTokenCookies) return res.status(401).json("You're not authenticated");
		if (refreshTokenUser !== refreshTokenCookies) {
			return res.status(403).json('Refresh token is not valid');
		}
		jwt.verify(refreshTokenCookies, process.env.JWT_REFRESH_KEY, (err, user) => {
			if (err) {
				console.log(err);
			}
			//create new access token, refresh token and send to user

			const newAccessToken = authController.generateAccessToken(user);
			const newRefreshToken = authController.generateRefreshToken(user);

			res.clearCookie('refreshToken');
			res.cookie('refreshToken', newRefreshToken, {
				httpOnly: true,
				secure: true,
				expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				path: '/',
				sameSite: 'none',
			});
			res.status(200).json({
				accessToken: newAccessToken,
				refreshToken: newRefreshToken,
			});
		});
	},

	//LOGOUT
	userLogout: async (req, res) => {
		res.clearCookie('refreshToken');
		res.status(200).json('LOGOUT!!');
	},

	changePassEmp: async (req, res) => {
		try {
			const password = req.body.newPassword;
			const user = await Employee.findOne({ username: req.body.username });

			if (!user) {
				return res.status(401).json({ error: 'Invalid username' });
			}

			if (user.is_deleted) {
				return res.status(403).json({
					error: 'Account has been deleted and is no longer accessible',
				});
			}

			const validPassword = await bcrypt.compare(req.body.oldPassword, user.password);
			if (!validPassword) {
				return res.status(402).json({ error: 'Old password is incorret' });
			}

			if (user && validPassword) {
				bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
					if (err) console.log(err);

					// hash the password using our new salt
					bcrypt.hash(password, salt, async function (err, hash) {
						if (err) return console.log(err);
						const newPassword = hash;
						// override the cleartext password with the hashed one
						await Employee.updateOne({ username: req.body.username }, { $set: { password: newPassword } });
					});
				});
			}

			res.status(200).json('Update successfully');
		} catch (error) {
			res.status(500).json(error);
		}
	},
};

module.exports = authController;
