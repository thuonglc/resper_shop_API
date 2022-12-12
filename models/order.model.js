const { Schema, model } = require('mongoose');

const orderSchema = new Schema(
	{
		orderBy: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
		delivery: [],
		products: [
			{
				product: {
					type: Schema.Types.ObjectId,
					ref: 'products',
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
	},
	{ collection: 'orders', timestamps: true }
);

module.exports = model('orders', orderSchema);
