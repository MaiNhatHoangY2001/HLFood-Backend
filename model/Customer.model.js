const mongoose = require('mongoose');

const customer = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	phone_num: {
		type: String,
		required: true,
		trim: true,
	},
	is_deleted: {
		type: Boolean,
		default: false,
	},
	status: {
		type: Number,
		default: 0,
	},
	order: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order',
		},
	],
});

module.exports = mongoose.model('Customer', customer);
