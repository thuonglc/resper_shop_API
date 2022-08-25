('use strict');

const fs = require('fs');
const moment = require('moment');
const slugify = require('slugify');
const queryString = require('query-string');
const { uploads, removes } = require('../utils/cloudinary');
const { APIFeatures } = require('../utils/api_features');
const Product = require('../models/product.model');

const stringToArrayRange = (string) => {
	return string.split(/\s*%\s*/);
};

const stringToArray = (string) => {
	if (typeof string === 'string') {
		return (string = string.split());
	}
	return string;
};

var that = (module.exports = {
	productsCount: async (req, res, next) => {
		let total = await Product.find({}).estimatedDocumentCount().exec();
		return res.status(200).json(total);
	},
	getProducts: async (req, res, next) => {
		const features = new APIFeatures(
			Product.find(
				{},
				{
					name: 1,
					image: { $slice: 1 },
					price: 1,
					priceCompare: 1,
					rating: 1,
					numReviews: 1,
				}
			),
			req.query
		)
			.filtering()
			.sorting()
			.paginating();
		Promise.all([features.query, Product.find({}).estimatedDocumentCount()]).then(
			([products, length]) => {
				return res.status(200).json({
					length: length,
					data: products,
				});
			}
		);
	},

	readProduct: async (req, res) => {
		const id = req.params.id;
		const product = await Product.findOne({ _id: id })
			.populate('category', '_id name')
			.populate('subs', '_id name')
			.exec();
		return res.status(200).json(product);
	},

	// admin
	getAllProducts: async (req, res, next) => {
		const features = new APIFeatures(
			Product.find(
				{},
				{
					name: 1,
					image: { $slice: 1 },
					price: 1,
					priceCompare: 1,
					rating: 1,
					numReviews: 1,
					category: 1,
					quantity: 1,
					subs: 1,
					sold: 1,
				}
			)
				.populate('category', '_id name')
				.populate('subs', '_id name'),
			req.query
		)
			.filtering()
			.sorting()
			.paginating();
		const products = await features.query;
		let total = await Product.find({}).estimatedDocumentCount().exec();
		return res.status(200).json({
			length: total,
			data: products,
		});
	},
	getProductByAdmin: async (req, res, next) => {
		const product = await Product.findOne({ _id: req.params.id })
			.populate('category', '_id name')
			.populate('subs', '_id name')
			.exec();
		return res.status(200).json(product);
	},
	createProduct: async (req, res, next) => {
		const files = req.files;
		try {
			let urls = [];
			const uploader = async (path, folder) => await uploads(path, folder);
			for (const file of files) {
				const { path } = file;
				const newPath = await uploader(path, 'shop_products');
				urls.push(newPath);
				fs.unlinkSync(path);
			}
			if (urls) {
				const product = JSON.parse(req.body.product);
				const newProduct = new Product({
					slug: slugify(product.name),
					image: urls,
					...product,
				});
				const result = await newProduct.save();
				return res.status(200).json({
					product: result,
				});
			}
			if (!urls) {
				return res.status(400).json({ message: 'Create failed' });
			}
		} catch (error) {
			console.error(`createProduct Controller::`, error.message);
			next(error);
		}
	},
	deleteProduct: async (req, res, next) => {
		try {
			const { id } = req.params;
			const product = await Product.find({ _id: id });
			// remove image on cloudinary
			if (product) {
				const { image } = product[0];
				for (let i = 0; i < image.length; i++) {
					await removes(image[i].id);
				}
			}
			const deleted = await Product.findOneAndRemove({ _id: id }).exec();
			return res.status(204).json({ message: 'delete successful' });
		} catch (error) {
			console.error(`deleteProduct Controller::`, error.message);
			next(error);
		}
	},
	removeImg: async (req, res, next) => {
		try {
			const { id, imgId } = req.body;
			const product = await Product.find({ _id: id });
			const rmImg = await removes(imgId);
			if (rmImg.result === 'ok') {
				const { image } = product[0];
				const newImgList = image.filter((i) => i.id !== imgId);
				const updated = await Product.findByIdAndUpdate(
					id,
					{ image: newImgList },
					{ new: true }
				).exec();
				return res.status(204).json({ message: 'delete successful' });
			}
		} catch (error) {
			console.error(`removeImg Controller::`, error.message);
			next(error);
		}
	},
	updateProduct: async (req, res, next) => {
		try {
			const { id } = req.params;
			const files = req.files;
			const product = JSON.parse(req.body.product);
			let newUrl = [];
			const oldProduct = await Product.findById({ _id: id }).exec();
			const { image } = oldProduct;
			const uploader = async (path, folder) => await uploads(path, folder);
			if (files.length > 0) {
				for (const file of files) {
					const { path } = file;
					const newPath = await uploader(path, 'shop_products');
					newUrl.push(newPath);
					fs.unlinkSync(path);
				}
				if (!newUrl) {
					// upload images to cloudinary failed
					return res.status(400).json({ message: 'Upload image failed' });
				}
			}
			const newIArray = [...image, ...newUrl];
			const updated = {
				slug: slugify(product.name),
				image: newUrl.length > 0 ? newIArray : image,
				...product,
			};
			const result = await Product.findByIdAndUpdate(id, updated, { new: true }).exec();
			return res.status(200).json(result);
		} catch (error) {
			console.error(`updateProduct Controller::`, error.message);
			next(error);
		}
	},
	listRelated: async (req, res, next) => {
		const product = await Product.findById(req.query.id).exec();
		const total = await Product.find({
			_id: { $ne: product._id },
			subs: product.subs,
		}).exec();
		const features = new APIFeatures(
			Product.find(
				{
					_id: { $ne: product._id },
					subs: product.subs,
				},
				{
					name: 1,
					image: { $slice: 1 },
					price: 1,
					priceCompare: 1,
					rating: 1,
					numReviews: 1,
				}
			),
			req.query
		).paginating();
		const products = await features.query;
		return res.status(200).json({
			data: {
				length: total.length,
				data: products,
			},
		});
	},
	handleQuery: async (req, res, query) => {
		const { page, limit, sort } = req.query;
		const currentPage = page || 1;
		const perPage = limit || 20;
		const products = await Product.find(
			{ $text: { $search: query } },
			{
				name: 1,
				image: { $slice: 1 },
				price: 1,
				priceCompare: 1,
				rating: 1,
				numReviews: 1,
			}
		)
			.skip((currentPage - 1) * perPage)
			.limit(Number(perPage))
			.sort(sort)
			.populate('category', '_id name')
			.populate('subs', '_id name')
			.exec();
		const total = await Product.find({ $text: { $search: query } });
		return res.status(200).json({
			length: total.length,
			data: products,
		});
	},
	searchFilters: async (req, response, next) => {
		const { page, limit, sort } = req.query;
		const currentPage = page || 0;
		const perPage = limit || 20;

		const {
			category,
			query,
			price,
			subs,
			rating,
			color,
			sex,
			type,
			sc,
			ram,
			rom,
			res,
			cpu,
			pin,
			face,
		} = req.query;

		const maxPrice = 999000000;
		const minRating = 0;
		const searchQuery = query ? { query: query.toLowerCase() } : { query: undefined };
		const priceRange = price
			? {
					price: {
						$gt: Number(stringToArrayRange(price)[0]),
						$lt: Number(stringToArrayRange(price)[1]),
					},
			  }
			: { price: undefined };
		const ratingRange = rating
			? { rating: { $gte: Number(stringToArrayRange(rating)[0]) } }
			: { rating: undefined };
		const subsArray = subs ? { subs: { $in: stringToArray(subs) } } : { subs: undefined };
		const colorArray = color ? { color: { $in: stringToArray(color) } } : { color: undefined };
		const sexArray = sex ? { sex: { $in: stringToArray(sex) } } : { sex: undefined };
		const typeArray = type ? { type: { $in: stringToArray(type) } } : { type: undefined };
		const scArray = sc ? { sc: { $in: stringToArray(sc) } } : { sc: undefined };
		const ramArray = ram ? { ram: { $in: stringToArray(ram) } } : { ram: undefined };
		const romArray = rom ? { rom: { $in: stringToArray(rom) } } : { rom: undefined };
		const resArray = res ? { res: { $in: stringToArray(res) } } : { res: undefined };
		const cpuArray = cpu ? { cpu: { $in: stringToArray(cpu) } } : { cpu: undefined };
		const pinArray = pin ? { pin: { $in: stringToArray(pin) } } : { pin: undefined };
		const faceArray = face ? { face: { $in: stringToArray(face) } } : { face: undefined };

		const filterArray = {
			...req.query,
			subs: subsArray.subs,
			price: priceRange.price,
			rating: ratingRange.rating,
			color: colorArray.color,
			sex: sexArray.sex,
			type: typeArray.type,
			sc: scArray.sc,
			ram: ramArray.ram,
			rom: romArray.rom,
			res: resArray.res,
			cpu: cpuArray.cpu,
			pin: pinArray.pin,
			face: faceArray.face,
		};

		Object.keys(filterArray).forEach((key) => {
			if (filterArray[key] === undefined) {
				delete filterArray[key];
			}
		});
		let products = [];
		let total = 0;
		if (searchQuery.query) {
			total = await Product.find({
				$and: [{ $text: { $search: `\"${searchQuery.query}\"` } }, filterArray],
			}).count();

			products = await Product.find(
				{
					$and: [{ $text: { $search: `\"${searchQuery.query}\"` } }, filterArray],
				},
				{
					name: 1,
					image: { $slice: 1 },
					price: 1,
					priceCompare: 1,
					rating: 1,
					numReviews: 1,
				}
			)
				.skip(currentPage * perPage)
				.limit(Number(perPage))
				.sort(sort);
		} else {
			total = await Product.find(filterArray).count();
			products = await Product.find(filterArray, {
				name: 1,
				image: { $slice: 1 },
				price: 1,
				priceCompare: 1,
				rating: 1,
				numReviews: 1,
			})
				.skip(currentPage * perPage)
				.limit(Number(perPage))
				.sort(sort);
		}
		return response.status(200).json({ data: products, total });
	},
});
