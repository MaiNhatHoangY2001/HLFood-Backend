const mongoose = require('mongoose');
const FoodModel = require('./Food.model');
const OrderModel = require('./Order.model');

const order_detail = new mongoose.Schema({
	time_created: {
		type: Date,
		default: Date.now,
	},
	quantity: {
		type: Number,
		default: 1,
	},
	quantity_finished: {
		type: Number,
		default: 0,
	},
	total_detail_price: {
		type: Number,
		default: 0,
	},
	description: {
		type: String,
	},
	status: {
		type: Number,
		default: 0,
	},
	food: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Food',
	},
	order: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Order',
	},
	notifications: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Notification',
		},
	],
});

order_detail.pre('save', async function (next) {
	try {
		//Save total_detail_price
		const food = await FoodModel.findById(this.food);
		this.total_detail_price = food.price * this.quantity;
		//Save total_order_price in order
		const order = await OrderModel.findById(this.order);
		order.total_order_price += this.total_detail_price + this.total_detail_price * order.vat;
		await order.save();
		next();
	} catch (err) {
		next(err);
	}
});

module.exports = mongoose.model('OrderDetail', order_detail);
