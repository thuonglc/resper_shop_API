('use strict');

const moment = require('moment');
const createError = require('http-errors');
const Cart = require('../models/cart.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');

var that = (module.exports = {
	createOrder: async (req, res, next) => {
		try {
			const timeOrder = moment().format();
			const { totalPayable, paymentMethod, feeDiscount, delivery } = req.body;
			const { id } = req.data;
			const userArray = await User.find({ _id: id }).exec();
			const user = userArray[0];
			let { products } = await Cart.findOne({ orderBy: user._id }).exec();
			let newOrder = await new Order({
				timeOrder,
				products,
				delivery: delivery || user.address,
				totalPayable,
				paymentMethod,
				feeDiscount,
				orderBy: user._id,
			}).save();
			// decrement quantity, increment sold
			let bulkOption = products.map((item) => {
				return {
					updateOne: {
						filter: { _id: item.product._id },
						update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
					},
				};
			});
			let updated = await Product.bulkWrite(bulkOption, {});
			return res.status(201).json(newOrder);
		} catch (error) {
			console.error(`createOrder Controller::`, error.message);
			next(error);
		}
	},
	getMyOrders: async (req, res, next) => {
		const { id } = req.data;
		const { page, limit } = req.query;
		const currentPage = page || 0;
		const perPage = limit || 20;
		const userArray = await User.find({ _id: id }).exec();
		const user = userArray[0];
		const orders = await Order.find({ orderBy: user._id })
			.skip(currentPage * perPage)
			.limit(Number(perPage))
			.populate('products.product', '_id name image')
			.exec();
		let total = await Order.find({ orderBy: user._id });
		return res.status(200).json({
			length: total.length,
			orders: orders,
		});
	},
	getOrderById: async (req, res, next) => {
		const { id } = req.params;
		const order = await Order.findById(id)
			.populate('products.product', '_id name price priceCompare image subs')
			.exec();
		return res.status(200).json(order);
	},
	updateOrderToPaid: async (req, res, next) => {
		try {
			const timePayOrder = moment().format();
			const { id } = req.params;
			let updated = await Order.findByIdAndUpdate(
				id,
				{ isPaid: true, paidAt: timePayOrder, paymentResult: req.body.paymentResult },
				{ new: true }
			).exec();
			return res.status(200).json({ ok: true });
		} catch (error) {
			console.error(`updateOrderToPaid Controller::`, error.message);
			next(error);
		}
	},

	// admin
	getAllOrders: async (req, res, next) => {
		const { page, limit } = req.query;
		const currentPage = page || 0;
		const perPage = limit || 20;
		const orders = await Order.find({})
			.sort('-createdAt')
			.skip(currentPage * perPage)
			.limit(Number(perPage))
			.populate('products.product', '_id name image')
			.exec();
		let total = await Order.find({}).estimatedDocumentCount().exec();
		return res.status(200).json({
			length: total,
			orders: orders,
		});
	},
	updateOrderStatus: async (req, res, next) => {
		try {
			const { orderId, orderStatus } = req.body;
			let updated = await Order.findByIdAndUpdate(orderId, { orderStatus }, { new: true }).exec();
			return res.status(200).json(updated);
		} catch (error) {
			console.error(`updateOrderStatus Controller::`, error.message);
			next(error);
		}
	},
	deleteOrder: async (req, res, next) => {
		try {
			const { id_order } = req.query;
			const id_user = req.data.id;
			if (id_user) {
				const searchCart = await Order.findById(id_order);
				if (!searchCart) {
					res.send(createError(404, 'no id cart'));
				}
				const deleteCart = await Order.findByIdAndDelete(id_order);
				if (!deleteCart) {
					res.send(createError(404, 'no cart'));
				}
				return res.status(204).json({
					status: 'delete success',
				});
			}
		} catch (error) {
			console.error(`deleteOrder Controller::`, error.message);
			next(error);
		}
	},
});
