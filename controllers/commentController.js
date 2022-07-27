import asyncHandler from 'express-async-handler'
import createError from 'http-errors'
import mongoose from 'mongoose'
import Comment from '../models/commentModel.js'
import Product from '../models/productModel.js'
import User from '../models/userModel.js'

class ApiFeatures {
	constructor(query, queryString) {
		this.query = query
	}

	sorting() {
		this.query = this.query.sort('-timeComment')
		return this
	}

	sortingComment() {
		this.query = this.query.sort('-timeComment')
		return this
	}
}

const getIdProduct = asyncHandler(async (req, res, next) => {
	try {
		const { _id_product } = req.query
		const page = parseInt(req.query.page) || 1
		const limit = parseInt(req.query.limit) || 5
		const start = (page - 1) * limit
		const end = start + limit
		const features = new ApiFeatures(Comment.find({ id_product: _id_product }), req.query).sorting()
		const dataComments = await Comment.find({ id_product: _id_product })
		const comments = await features.query
		const product = await Product.findById({ _id: _id_product }, { __v: 0 })
		const oneStarsResult = await Comment.find({ id_product: _id_product, start: 1 })
		const twoStarsResult = await Comment.find({ id_product: _id_product, start: 2 })
		const threeStarsResult = await Comment.find({ id_product: _id_product, start: 3 })
		const fourStarsResult = await Comment.find({ id_product: _id_product, start: 4 })
		const fiveStarsResult = await Comment.find({ id_product: _id_product, start: 5 })
		const sumStarRating =
			oneStarsResult.length +
			twoStarsResult.length +
			threeStarsResult.length +
			fourStarsResult.length +
			fiveStarsResult.length
		const starRating = {
			oneStars: oneStarsResult.length,
			twoStars: twoStarsResult.length,
			threeStars: threeStarsResult.length,
			fourStars: fourStarsResult.length,
			fiveStars: fiveStarsResult.length,
		}
		const resultComments = comments.slice(0, end)
		res.status(200).json({
			status: 'success',
			start: 0,
			end: end,
			limit: limit,
			starRating: starRating,
			sumStarRating: sumStarRating,
			reviewRating: sumStarRating > 0 && product.rating > 0 ? product.rating / sumStarRating : 0,
			length: dataComments.length,
			data: resultComments,
		})
	} catch (error) {
		if (error instanceof mongoose.CastError) {
			next(createError(400, 'invalid product id'))
			return
		}
		next(error)
	}
})

const deleteIdComment = asyncHandler(async (req, res) => {
	try {
		const { id, _id_product } = req.query
		const onlyUser = await User.findById(req.data.id)
		const comment = await Comment.findByIdAndDelete(id)
		const product = await Product.findById(_id_product)
		if (onlyUser) {
			let num = product.numReviews
			let rate = product.rating
			let start_cmt = comment.start
			if (start_cmt > 0) {
				const options = { new: true }
				const data = {
					rating: rate - start_cmt,
					numReviews: num - 1,
				}
				await Product.findByIdAndUpdate(_id_product, data, options)
			}
			const dataComments = await Comment.find({ id_product: _id_product })
			res.status(200).json({
				status: 'success',
				length: dataComments.length,
				data: comment,
			})
		}
	} catch (error) {
		console.log(error)
		res.send(error)
	}
})

const historyComment = asyncHandler(async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1
		const item = parseInt(req.query.item) || 5
		const start = (page - 1) * item
		const end = start + item
		const onlyUser = await User.findById(req.data.id)
		const { _id } = onlyUser
		const features = new ApiFeatures(Comment.find({ id_user: _id }), req.query).sortingComment()
		const list_comments = await features.query
		const length_data = await Comment.find({ id_user: _id })
		const result_comments = list_comments.slice(0, end)
		if (onlyUser) {
			res.status(200).json({
				onlyUser: onlyUser,
				status: 'success',
				start: 0,
				end: end,
				item: item,
				length: length_data.length,
				comment: result_comments,
			})
		}
	} catch (error) {
		console.log(error)
	}
})

export { getIdProduct, deleteIdComment, historyComment }
