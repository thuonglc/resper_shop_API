('use strict');

const slugify = require('slugify');
const Sub = require('../models/sub.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');

var that = (module.exports = {
	getCategories: async (req, res, next) => {
		const categories = await Category.find({}).sort({ createdAt: -1 });
		return res.status(200).json(categories);
	},
	createCategory: async (req, res, next) => {
		try {
			const { name } = req.body;
			const newCategory = await new Category({ name, slug: slugify(name) }).save();
			return res.status(200).json(newCategory);
		} catch (error) {
			console.error(`createCategory Controller::`, error.message);
			next(error);
		}
	},
	readCategory: async (req, res, next) => {
		let category = await Category.findOne({ slug: req.params.slug }).exec();
		const products = await Product.find({ category }).populate('category').exec();
		return res.status(200).json({
			category,
			products,
		});
	},
	updateCategory: async (req, res, next) => {
		const { nameEdit, id } = req.body;
		try {
			const updated = await Category.findOneAndUpdate(
				{ _id: id },
				{ name: nameEdit, slug: slugify(nameEdit) },
				{ new: true }
			);
			return res.status(200).json(updated);
		} catch (error) {
			console.error(`updateCategory Controller::`, error.message);
			next(error);
		}
	},
	deleteCategory: async (req, res, next) => {
		try {
			const deleted = await Category.findOneAndDelete({ _id: req.params.id });
			return res.status(204).json({ message: 'Deleted category' });
		} catch (error) {
			console.error(`deleteCategory Controller::`, error.message);
			next(error);
		}
	},
	getCategorySubs: async (req, res, next) => {
		let subs = await Sub.find({ parent: req.params.id }).exec();
		return res.status(200).json(subs);
	},
});
