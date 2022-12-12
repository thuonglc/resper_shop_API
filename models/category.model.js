const { Schema, model } = require('mongoose');

const categorySchema = new Schema(
	{
		name: {
			type: String,
			trim: true,
			required: 'Name is required',
			minlength: [2, 'Too short'],
			maxlength: [32, 'Too long'],
		},
		slug: {
			type: String,
			unique: true,
			lowercase: true,
			index: true,
		},
	},
	{
		collection: 'categories',
		timestamps: true,
	}
);

module.exports = model('categories', categorySchema);
