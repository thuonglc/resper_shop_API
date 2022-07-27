import mongoose from 'mongoose'

const cartScheme = mongoose.Schema({
	orderBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
	products: [
		{
			product: {
				type: mongoose.SchemaTypes.ObjectId,
				ref: 'Product',
			},
			quantity: Number,
			price: Number,
		},
	],
	cartTotal: { type: Number, required: true },
	totalAfterDiscount: Number,
	timeCart: { type: String, required: true },
})

const Cart = mongoose.model('Cart', cartScheme)

export default Cart
