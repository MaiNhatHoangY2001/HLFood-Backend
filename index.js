const express = require('express');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const socket = require('socket.io');

const app = express();

dotenv.config();

//ROUTES
const authEmp = require('./routes/authEmp');
const foodRoutes = require('./routes/foodRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const empRoutes = require('./routes/empRoutes');
const cusRoutes = require('./routes/cusRoutes');
const notifiRoutes = require('./routes/notificationRoutes');
const uploadFileRoutes = require('./routes/uploadFileRoutes');

const port = process.env.PORT || 8000;

const origin = process.env.NODE_ENV !== 'production' ? process.env.LOCAL_ENV : process.env.DEPLOY_ENV;

//CONNECT DATABASE
mongoose.connect(process.env.MONGODB_URL, () => {
	console.log('Connect to MongoDB');
});

//SSO

// Initialize the Express Session middleware
app.use(
	session({
		secret: process.env.COOKIE_KEY,
		resave: true,
		saveUninitialized: true,
	})
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(
	cors({
		credentials: true,
		origin,
	})
);
app.use(morgan('common'));

//ROUTERS
app.use('/auth', authEmp);
app.use('/api', foodRoutes);
app.use('/api', tableRoutes);
app.use('/api', orderRoutes);
app.use('/api', empRoutes);
app.use('/api', cusRoutes);
app.use('/api', notifiRoutes);
app.use('/api/files', uploadFileRoutes);

const server = app.listen(port, () => {
	console.log(`server is running... at ${port}`);
});

//IO socket

const io = socket(server, {
	cors: {
		origin,
		credential: true,
	},
});

io.on('connection', (socket) => {
	socket.on('list-order', (data) => {
		io.emit('sent-list-order', data);
	});

	socket.on('notification', (data) => {
		io.emit('sent-notification', data);
	});
});
