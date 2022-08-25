('use strict');

const slugify = require('slugify');
const Sub = require('../models/sub.model');
const Product = require('../models/product.model');

var that = (module.exports = {
	getSubs: async (req, res, next) => {
		return res.status(200).json(
			await Sub.find(
				{},
				{
					name: 1,
					createdAt: 1,
				}
			)
				.populate('parent', 'name')
				.sort({ createdAt: -1 })
				.exec()
		);
	},
	createSub: async (req, res, next) => {
		try {
			const { name, parent } = req.body;
			const newSub = await new Sub({ name, parent, slug: slugify(name) }).save();
			return res.status(200).json(newSub);
		} catch (error) {
			console.error(`createSub Controller::`, error.message);
			next(error);
		}
	},
	readSub: async (req, res) => {
		let sub = await Sub.findOne({ slug: req.params.slug }).exec();
		const products = await Product.find({ subs: sub }).populate('category').exec();
		return res.status(200).json({
			sub,
			products,
		});
	},
	updateSub: async (req, res, next) => {
		try {
			const { name, parent, id } = req.body;
			const updated = await Sub.findOneAndUpdate(
				{ _id: id },
				{ name, parent, slug: slugify(name) },
				{ new: true }
			);
			return res.status(200).json(updated);
		} catch (error) {
			console.error(`updateSub Controller::`, error.message);
			next(error);
		}
	},
	deleteSub: async (req, res) => {
		try {
			const deleted = await Sub.findOneAndDelete({ _id: req.params.id });
			return res.status(204).json({ message: 'Deleted sub' });
		} catch (error) {
			console.error(`updateSub Controller::`, error.message);
			next(error);
		}
	},
});
