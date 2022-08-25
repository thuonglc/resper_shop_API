const { Schema, model } = require('mongoose');

const cartSchema = new Schema(
	{
		orderBy: { type: Schema.Types.ObjectId, ref: 'users' },
		products: [
			{
				product: {
					type: Schema.Types.ObjectId,
					ref: 'products',
				},
				quantity: Number,
				price: Number,
			},
		],
		cartTotal: { type: Number, required: true },
		totalAfterDiscount: Number,
		timeCart: { type: String, required: true },
	},
	{
		collection: 'carts',
		timestamps: true,
	}
);

module.exports = model('carts', cartSchema);
