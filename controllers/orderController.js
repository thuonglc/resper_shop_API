import createError from 'http-errors'
import moment from 'moment'
import Cart from '../models/cartModel.js'
import Order from '../models/orderModel.js'
import Product from '../models/productModel.js'
import User from '../models/userModel.js'

const createOrder = async (req, res, next) => {
	try {
		const timeOrder = moment().format()
		const { totalPayable, paymentMethod, feeDiscount } = req.body
		const { id } = req.data
		const userArray = await User.find({ _id: id }).exec()
		const user = userArray[0]
		let { products } = await Cart.findOne({ orderBy: user._id }).exec()
		let newOrder = await new Order({
			timeOrder,
			products,
			totalPayable,
			paymentMethod,
			feeDiscount,
			orderBy: user._id,
		}).save()
		// decrement quantity, increment sold
		let bulkOption = products.map((item) => {
			return {
				updateOne: {
					filter: { _id: item.product._id },
					update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
				},
			}
		})
		let updated = await Product.bulkWrite(bulkOption, {})
		res.json(newOrder)
	} catch (error) {
		res.send(createError(404, error))
	}
}

const getOrderById = async (req, res) => {
	try {
		const { id } = req.params
		const order = await Order.findById(id)
			.populate('user', 'name email')
			.populate('products.product', '_id name price priceCompare image subs')
			.exec()
		if (order) {
			res.status(200).json(order)
		}
	} catch (error) {
		res.send(createError(404, error))
	}
}

const getMyOrders = async (req, res) => {
	try {
		const { id } = req.data
		const { page, limit } = req.query
		const currentPage = page || 1
		const perPage = limit || 20
		const userArray = await User.find({ _id: id }).exec()
		const user = userArray[0]
		const orders = await Order.find({ orderBy: user._id })
			.skip((currentPage - 1) * perPage)
			.limit(Number(perPage))
			.populate('products.product', '_id name image')
			.exec()
		let total = await Order.find({ orderBy: user._id })
		res.json({
			length: total.length,
			orders: orders,
		})
	} catch (err) {
		res.send(createError(404, err))
	}
}

const updateOrderToPaid = async (req, res) => {
	try {
		const timePayOrder = moment().format()
		const { id } = req.params
		console.log(req.body)
		const order = await Order.findById(id)
		console.log(order)
		if (order) {
			order.isPaid = true
			order.paidAt = timePayOrder
			order.orderStatus = 'Processing'
			order.paymentResult = {
				id: req.body.paymentResult.id,
				status: req.body.paymentResult.status,
				update_time: req.body.paymentResult.update_time,
				email_address: req.body.paymentResult.payer.email_address,
			}
			const updatedOrder = await order.save()
			res.status(200).json({ ok: true })
		}
	} catch (error) {
		res.send(createError(404, error))
	}
}

//admin
const getAllOrders = async (req, res) => {
	try {
		const { page, limit } = req.query
		const currentPage = page || 1
		const perPage = limit || 20
		const orders = await Order.find({})
			.sort('-createdAt')
			.skip((currentPage - 1) * perPage)
			.limit(Number(perPage))
			.populate('products.product', '_id name image')
			.exec()
		let total = await Order.find({}).estimatedDocumentCount().exec()
		res.json({
			length: total,
			orders: orders,
		})
	} catch (err) {
		res.send(createError(404, err))
	}
}

const updateOrderStatus = async (req, res) => {
	const { orderId, orderStatus } = req.body.data
	let updated = await Order.findByIdAndUpdate(orderId, { orderStatus }, { new: true }).exec()
	res.json(updated)
}

const deleteOrder = async (req, res, next) => {
	try {
		const { id_order } = req.query
		const id_user = req.data.id

		if (id_user) {
			const searchCart = await Order.findById(id_order)
			if (!searchCart) {
				res.send(createError(404, 'no id cart'))
			}
			const deleteCart = await Order.findByIdAndDelete(id_order)
			if (!deleteCart) {
				res.send(createError(404, 'no cart'))
			}
			res.status(200).json({
				status: 'delete success',
				data: deleteCart,
			})
		}
	} catch (error) {
		res.send(createError(404, error))
	}
}

export {
	createOrder,
	getOrderById,
	getMyOrders,
	getAllOrders,
	deleteOrder,
	updateOrderToPaid,
	updateOrderStatus,
}
