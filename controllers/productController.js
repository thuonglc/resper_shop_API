import fs from 'fs'
import slugify from 'slugify'
import { uploads } from '../cloudinary.js'
import Product from '../models/productModel.js'

// Filter, sorting and paginating
class APIFeatures {
	constructor(query, queryString) {
		this.query = query
		this.queryString = queryString
	}

	filtering() {
		const queryObj = { ...this.queryString } //queryString = req.query

		const excludedFields = ['page', 'sort', 'limit']
		excludedFields.forEach((el) => delete queryObj[el])

		let queryStr = JSON.stringify(queryObj)
		queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex)\b/g, (match) => '$' + match)

		//    gte = greater than or equal
		//    lte = less than or equal
		//    lt = lesser than
		//    gt = greater than
		this.query.find(JSON.parse(queryStr))

		return this
	}

	sorting() {
		if (this.queryString.sort) {
			const sortBy = this.queryString.sort.split(',').join(' ')
			this.query = this.query.sort(sortBy)
		} else {
			this.query = this.query.sort('-createdAt')
		}

		return this
	}

	paginating() {
		const page = this.queryString.page * 1 || 1
		const limit = this.queryString.limit * 1 || 15
		const skip = (page - 1) * limit
		this.query = this.query.skip(skip).limit(limit)
		return this
	}
}

class ApiFeatures {
	constructor(query, queryString) {
		this.query = query
	}

	sorting() {
		this.query = this.query.sort('-createdAt')
		return this
	}
}

const productsCount = async (req, res) => {
	let total = await Product.find({}).estimatedDocumentCount().exec()
	res.json(total)
}

const getProducts = async (req, res) => {
	try {
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
			.paginating()
		const products = await features.query
		let total = await Product.find({}).estimatedDocumentCount().exec()
		res.json({
			length: total,
			data: products,
		})
	} catch (err) {
		console.log(err)
		return res.status(500).json({ msg: err.message })
	}
}

const readProduct = async (req, res) => {
	const id = req.params.id
	const product = await Product.findOne({ _id: id })
		.populate('category', '_id name')
		.populate('subs', '_id name')
		.exec()
	res.status(200).json(product)
}

const createProduct = async (req, res) => {
	const files = req.files
	try {
		let urls = []
		const uploader = async (path) => await uploads(path)
		for (const file of files) {
			const { path } = file
			const newPath = await uploader(path)
			urls.push(newPath)
			fs.unlinkSync(path)
		}
		if (urls) {
			const product = JSON.parse(req.body.product)
			console.log(product)
			const slug = slugify(product.name)
			const newProduct = new Product({
				slug,
				image: urls,
				...product,
			})
			const result = await newProduct.save()
			res.status(200).json({
				message: 'image upload successful',
				product: result,
			})
		}
		if (!urls) {
			return res.status(400).json({ message: 'create failed' })
		}
	} catch (err) {
		console.log(err)
		return res.status(400).send('Product create failed')
	}
}

const deleteProduct = async (req, res) => {
	try {
		const { id } = req.params
		console.log(req.params)
		const product = await Product.find({ _id: id }).exec()
		const { image } = product[0]
		// remove image on cloudinary
		removeItemI(image)
		const deleted = await Product.findOneAndRemove({ _id: id }).exec()
		res.json({ message: 'delete successful', deleted })
	} catch (err) {
		console.log(err)
		return res.status(400).send('Product delete failed')
	}
}

const updateProduct = async (req, res) => {
	//the files different original images
	const files = req.files
	try {
		const product = JSON.parse(req.body.product)
		const {
			name,
			description,
			price,
			priceCompare,
			shipping,
			quantity,
			category,
			subs,
			imageOld,
			id_product,
		} = product
		let urls = []
		if (files.length > 0) {
			const uploader = async (path) => await uploads(path)
			for (const file of files) {
				const { path } = file
				const newPath = await uploader(path)
				urls.push(newPath)
				fs.unlinkSync(path)
			}
			const newIArray = [...imageOld, ...urls]
			if (!urls) {
				//upload images to cloudinary failed
				return res.status(400).json({ message: 'Update failed' })
			}
			const slug = slugify(name)
			const updated = {
				name: name.trim(),
				description: description.trim(),
				price,
				slug,
				priceCompare,
				shipping,
				quantity,
				category,
				subs,
				image: urls.length > 0 ? newIArray : imageOld,
			}
			const result = await Product.findByIdAndUpdate(id_product, updated, { new: true }).exec()
			res.status(200).json({
				message: 'Update successful',
				product: result,
			})
		}
	} catch (err) {
		return res.status(400).send('Product update failed')
	}
}

const listRelated = async (req, res) => {
	try {
		const product = await Product.findById(req.query.id).exec()
		const total = await Product.find({
			_id: { $ne: product._id },
			subs: product.subs,
		}).exec()
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
		).paginating()
		const products = await features.query
		res.json({
			length: total.length,
			data: products,
		})
	} catch (err) {
		console.log(err)
		return res.status(500).json({ msg: err.message })
	}
}

const handleQuery = async (req, res, query) => {
	console.log('quer', query)
	const { page, limit, sort } = req.query
	const currentPage = page || 1
	const perPage = limit || 20
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
		.exec()
	const total = await Product.find({ $text: { $search: query } })

	res.json({
		length: total.length,
		data: products,
	})
}

const searchFilters = async (req, res) => {
	console.log(req.query)
	try {
		const { query, price, star } = req.query
		if (query) {
			console.log('query --->', query)
			await handleQuery(req, res, query)
		} else if (price?.length > 0) {
			const queryExcludePrice = {
				...req.query,
				price: {
					gte: price[0],
					lte: price[1],
				},
			}
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
				queryExcludePrice
			)
				.filtering()
				.sorting()
				.paginating()
			const products = await features.query
			res.json({
				length: products.length,
				data: products,
			})
		} else if (star?.length > 0) {
			const queryExcludeStar = {
				...req.query,
				star: {
					gte: star[0],
					lte: star[1],
				},
			}
			console.log('queryExcludeStar --->', queryExcludeStar)
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
				queryExcludeStar
			)
				.filtering()
				.sorting()
				.paginating()
			const products = await features.query
			res.json({
				length: products.length,
				data: products,
			})
		} else {
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
				.paginating()
			const products = await features.query
			const featureLength = new APIFeatures(Product.find({}), req.query).filtering().sorting()
			const productLength = await featureLength.query
			const length = productLength.length
			res.json({
				length: length,
				data: products,
			})
		}
	} catch (err) {
		console.log(err)
		return res.status(500).json({ msg: err.message })
	}
}

export {
	getProducts,
	createProduct,
	readProduct,
	productsCount,
	deleteProduct,
	updateProduct,
	listRelated,
	searchFilters,
}
