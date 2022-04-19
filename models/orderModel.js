import mongoose from 'mongoose'

const orderSchema = mongoose.Schema({
	orderBy: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: 'User' },
	products: [
		{
			product: {
				type: mongoose.SchemaTypes.ObjectId,
				ref: 'Product',
			},
			quantity: Number,
		},
	],
	paymentMethod: {
		type: String,
		required: true,
		default: 'Paypal',
	},
	isPaid: { type: Boolean, required: true, default: false },
	paidAt: { type: Date },
	paymentResult: {},
	paymentIntent: {},
	// taxPrice: { type: Number, required: true, default: 0.0 },
	// shippingPrice: { type: Number, required: true, default: 0.0 },
	totalPayable: { type: Number, required: true },
	feeDiscount: { type: Number, default: 0 },
	orderStatus: {
		type: String,
		default: 'Chưa thực hiện',
	},
	timeOrder: { type: String, required: true },
	message: { type: String, default: '' },
})

const Order = mongoose.model('Order', orderSchema)

export default Order
