const { Schema, model } = require('mongoose');

const subSchema = new Schema(
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
		parent: { type: Schema.Types.ObjectId, ref: 'categories', required: true },
	},
	{ collection: 'subs', timestamps: true }
);

module.exports = model('subs', subSchema);
