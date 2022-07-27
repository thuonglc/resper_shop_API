import bcrypt from 'bcryptjs'
import { google } from 'googleapis'
import createError from 'http-errors'
import JWT from 'jsonwebtoken'
import moment from 'moment'
import mongoose from 'mongoose'
import Cart from '../models/cartModel.js'
import Comment from '../models/commentModel.js'
import Coupon from '../models/couponModel.js'
import User from '../models/userModel.js'
import cloudinaryConfig from '../utils/cloudinary.js'
import { signAccessToken, signRefreshToken, verilyRefreshToken } from '../utils/jwt_helpers.js'
import sendMail from './sendMail.js'
import { APIFeatures } from '../utils/api_features.js'

const { OAuth2 } = google.auth
const { GOOGLE_LOGIN_SERVICE_CLIENT_ID, GOOGLE_LOGIN_SECRET, CLIENT_URL, ACTIVATION_TOKEN_SECRET } =
	process.env

const client = new google.auth.OAuth2(GOOGLE_LOGIN_SERVICE_CLIENT_ID)

const createAccessToken = (payload) => {
	return JWT.sign(payload, ACTIVATION_TOKEN_SECRET, { expiresIn: '15m' })
}
const createActivationToken = (payload) => {
	return JWT.sign(payload, ACTIVATION_TOKEN_SECRET, { expiresIn: '5m' })
}

const registerUser = async (req, res) => {
	try {
		const { name, email, password } = req.body
		const doseExists = await User.findOne({ email: email })
		if (doseExists) return res.status(400).json({ message: 'User already exists' })
		if (!password) return res.status(400).json({ message: 'Please enter your password' })
		if (password.length < 6)
			return res.status(400).json({ message: 'Password is at least 6 characters long.' })

		// password encryption
		const passwordHash = await bcrypt.hash(password, 12)
		const newUser = { name, email, password: passwordHash }
		const accessToken = createActivationToken(newUser)
		const url = `${CLIENT_URL}/user/active-email/${accessToken}`
		sendMail(email, 'Verify your email address', url, name, 'Click to active your email')
		res.status(200).json({
			message: 'Activate your account',
		})
	} catch (error) {
		res.status(400).json({
			message: error,
		})
	}
}

const loginByGoogle = async (req, res) => {
	try {
		const { tokenId } = req.body
		const verify = await client.verifyIdToken({
			idToken: tokenId,
			audience: GOOGLE_LOGIN_SERVICE_CLIENT_ID,
		})
		const { email_verified, email, name, picture } = verify.payload
		if (!email_verified) return res.status(400).json({ message: 'Email verification failed.' })
		const user = await User.findOne({ email: email })
		const password = email + GOOGLE_LOGIN_SECRET
		const passwordHash = await bcrypt.hash(password, 12)
		if (user) {
			const accessToken = await signAccessToken(user._id)
			res.status(200).json({
				user: user,
				accessToken: accessToken,
			})
		} else {
			const newUser = new User({
				_id: new mongoose.Types.ObjectId(),
				name,
				email,
				password: passwordHash,
				avatar: picture,
			})
			await newUser.save()
			const users = await User.findOne({ email: email })
			const accessToken = await signAccessToken(users._id)
			res.status(200).json({
				user: users,
				accessToken: accessToken,
			})
		}
	} catch (error) {
		console.log(error)
		res.status(400).json({
			message: error,
		})
	}
}

const login = async (req, res) => {
	try {
		const { email, password } = req.body
		const user = await User.findOne({ email: email.toLowerCase().trim() })
		if (!user) return res.status(400).json({ message: 'User does not exist' })
		const isMatch = await bcrypt.compare(password, user.password)
		if (!isMatch) return res.status(400).json({ message: 'Invalid password' })
		const accessToken = await signAccessToken(user)
		const refreshToken = await signRefreshToken(user)
		const userResult = await User.findById(user._id)
		res.send({
			accessToken: accessToken,
			refreshToken: refreshToken,
			user: userResult,
		})
	} catch (error) {
		res.status(400).json({
			message: error,
		})
	}
}

const getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.data.id).select('-password')
		if (!user) return res.status(400).json({ message: 'User does not exist.' })
		res.status(200).json(user)
	} catch (error) {
		console.log(error)
		res.status(400).json({
			message: error,
		})
	}
}

const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.body
		if (!refreshToken) throw createError.BadRequest()
		const id = await verilyRefreshToken(refreshToken)
		const accessToken = await signAccessToken(id)
		const refToken = await signRefreshToken(id)
		res.send({ accessToken: accessToken, refreshToken: refToken })
	} catch (error) {
		res.status(400).json({
			message: error,
		})
	}
}

const updateUserImage = async (req, res) => {
	try {
		const { id } = req.data
		const options = { new: true }
		const file = req.file
		await cloudinaryConfig.v2.uploader.upload(
			file.path,
			{ folder: 'test' },
			async (error, result) => {
				if (result) {
					const userSave = {
						avatar: result.url,
					}
					const update = {
						avatar: result.url,
					}
					const user = await User.findByIdAndUpdate(id, userSave, options)
					const comment = await Comment.updateMany({ id_user: id }, update, options)
					const dataReply = await Comment.find()
					for (let index = 0; index < dataReply.length; index++) {
						const reply = Array.from(dataReply[index].reply)
						if (reply.length > 0) {
							for (let j = 0; j < reply.length; j++) {
								const element = reply[j]
								if (element.id_user === id) {
									element.avatar = result.url
									const id_array = dataReply[index]._id
									await Comment.findByIdAndUpdate(id_array, { reply: reply }, options)
								}
							}
						}
					}
					res.json({
						user: user,
						comment: comment,
					})
				}
			}
		)
	} catch (error) {
		res.send(error)
	}
}

const updateUserInfo = async (req, res) => {
	try {
		// req.body = {name, phone, gender, dob, address...}
		const { id } = req.data
		const user = await User.findById(id).select('-password')
		if (!user) return res.status(400).json({ message: 'User does not exist.' })
		const updated = await User.findByIdAndUpdate(id, req.body, { new: true })
		res.status(200).json({
			updated,
		})
	} catch (error) {
		res.status(400).json({
			message: error,
		})
	}
}

const changePassword = async (req, res) => {
	try {
		const { id } = req.data
		const { password } = req.body
		if (password.length < 6)
			return res.status(400).json({ message: 'Password is at least 6 characters long.' })
		const result = await User.findById(id)
		if (result) {
			const passwordHash = await bcrypt.hash(password, 12)
			await User.findOneAndUpdate({ _id: id }, { password: passwordHash })
			res.status(200).json({
				message: 'Password has been changed successfully',
			})
		}
	} catch (err) {
		console.log(err)
	}
}

const activeEmail = async (req, res) => {
	try {
		const { accessToken } = req.body
		const user = JWT.verify(accessToken, ACTIVATION_TOKEN_SECRET)
		const { email, password, name } = user
		const checkEmail = await User.findOne({ email: email })
		if (checkEmail) return res.status(400).json({ message: 'User already exists' })
		const userSave = new User({
			_id: new mongoose.Types.ObjectId(),
			name: name.trim(),
			email: email,
			password: password,
			role: 0,
		})
		const result = await userSave.save()
		const token = await signAccessToken(result._id)
		res.status(200).json({
			user: result,
			token,
		})
	} catch (error) {
		res.status(400).json({
			message: error,
		})
	}
}

const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body
		const user = await User.findOne({ email: email.toLowerCase().trim() })
		if (!user) return res.status(400).json({ message: 'Email does not exist' })
		const access_token = createAccessToken({ email: email })
		const url = `${CLIENT_URL}/user/reset-password/${access_token}`
		sendMail(email, 'Reset your password', url, user.name, 'Click to create a new password')
		res.json({ message: 'Create a new password, please check your email' })
	} catch (error) {
		console.log(error)
		res.status(400).json({
			message: error,
		})
	}
}

const resetPassword = async (req, res) => {
	try {
		const { password, accessToken } = req.body
		const result = JWT.verify(accessToken, ACTIVATION_TOKEN_SECRET)
		const user = await User.findOne({ email: result.email })
		if (!password) return res.status(400).json({ message: 'Enter your new password' })
		if (!user) return res.status(400).json({ message: 'User does not exist' })
		const passwordHash = await bcrypt.hash(password, 12)
		await User.findOneAndUpdate({ email: result.email }, { password: passwordHash })
		const token = await signAccessToken(user._id)
		res.status(200).json({
			user: user,
			token,
		})
	} catch (error) {
		res.status(400).json({
			message: error,
		})
	}
}

const getUserAddress = async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.query.id }).exec()
		res.status(200).json(user.address)
	} catch (error) {
		console.log(error)
		res.status(400).json({
			message: error,
		})
	}
}

const saveAddress = async (req, res) => {
	try {
		const { id } = req.data
		const user = await User.findOne({ _id: id }).exec()
		const updated = await User.findOneAndUpdate({ email: user.email }, req.body, {
			new: true,
		}).exec()
		res.status(200).json(updated.address)
	} catch (error) {
		console.log(error)
		res.status(400).json({
			message: error,
		})
	}
}

const savePaymentMethod = async (req, res) => {
	try {
		const { id } = req.data
		const user = await User.findOne({ _id: id }).exec()
		const updated = await User.findOneAndUpdate(
			{ email: user.email },
			{ paymentMethod: req.body.paymentMethod },
			{ new: true }
		).exec()
		res.status(200).json(updated.paymentMethod)
	} catch (error) {
		console.log(error)
		res.status(400).json({
			message: error,
		})
	}
}

// coupon
const applyCoupon = async (req, res) => {
	const { coupon } = req.body
	const validCoupon = await Coupon.findOne({ name: coupon }).exec()
	if (validCoupon === null || validCoupon.expiry < moment()) {
		return res.json({
			err: 'Invalid coupon',
		})
	}
	const { id } = req.data
	const userArray = await User.find({ _id: id }).exec()
	const user = userArray[0]
	let { products, cartTotal } = await Cart.findOne({ orderBy: user._id })
		.populate('products.product', '_id name price')
		.exec()
	// calculate the total after discount
	let totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount) / 100).toFixed(2) // 99.99
	await Cart.findOneAndUpdate({ orderBy: user._id }, { totalAfterDiscount }, { new: true }).exec()

	res.json({ value: totalAfterDiscount })
}

// wishlist
const addToWishlist = async (req, res) => {
	const { params } = req.body

	const user = await User.findOneAndUpdate(
		{ email: req.user.email },
		{ $addToSet: { wishlist: params } }
	).exec()

	res.json({ ok: true })
}

const wishlist = async (req, res) => {
	const list = await User.findOne({ email: req.user.email })
		.select('wishlist')
		.populate('wishlist')
		.exec()

	res.json(list)
}

const removeFromWishlist = async (req, res) => {
	const { params } = req.params
	const user = await User.findOneAndUpdate(
		{ email: req.user.email },
		{ $pull: { wishlist: params } }
	).exec()

	res.json({ ok: true })
}

// admin
const getAllUsers = async (req, res) => {
	try {
		const features = new APIFeatures(User.find({}), req.query).filtering().sorting().paginating()
		const users = await features.query
		res.json(users)
	} catch (err) {
		return res.status(500).json({ msg: err.message })
	}
}

export {
	loginByGoogle,
	registerUser,
	login,
	getProfile,
	refreshToken,
	updateUserImage,
	updateUserInfo,
	changePassword,
	activeEmail,
	forgotPassword,
	resetPassword,
	getUserAddress,
	saveAddress,
	savePaymentMethod,
	addToWishlist,
	wishlist,
	removeFromWishlist,
	applyCoupon,
	getAllUsers,
}
