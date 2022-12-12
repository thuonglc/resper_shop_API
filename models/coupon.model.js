const { Schema, model } = require('mongoose');

const couponSchema = new Schema(
	{
		name: {
			type: String,
			trim: true,
			unique: true,
			uppercase: true,
			required: 'Name is required',
			minlength: [6, 'Too short'],
			maxlength: [12, 'Too long'],
		},
		expiry: {
			type: Date,
			required: true,
		},
		discount: {
			type: Number,
			required: true,
		},
	},
	{ collection: 'coupons', timestamps: true }
);

module.exports = model('coupons', couponSchema);
