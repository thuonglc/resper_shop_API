('use strict');

const mongoose = require('mongoose');
const moment = require('moment');
const JWT = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const createError = require('http-errors');

const {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} = require('../utils/jwt_helpers.js');

const { sendMail } = require('../controllers/mail.controller');
const { APIFeatures } = require('../utils/api_features');
const Cart = require('../models/cart.model');
const Comment = require('../models/comment.model');
const Coupon = require('../models/coupon.model');
const User = require('../models/user.model');

const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const { GOOGLE_LOGIN_SERVICE_CLIENT_ID, GOOGLE_LOGIN_SECRET, CLIENT_URL, ACTIVATION_TOKEN_SECRET } =
	process.env;
const client = new google.auth.OAuth2(GOOGLE_LOGIN_SERVICE_CLIENT_ID);

const createAccessToken = (payload) => {
	return JWT.sign(payload, ACTIVATION_TOKEN_SECRET, { expiresIn: '15m' });
};
const createActivationToken = (payload) => {
	return JWT.sign(payload, ACTIVATION_TOKEN_SECRET, { expiresIn: '5m' });
};

var that = (module.exports = {
	registerUser: async (req, res, next) => {
		try {
			const { name, email, password } = req.body;
			const doseExists = await User.findOne({ email: email });
			if (doseExists) return res.status(400).json({ message: 'User already exists' });
			if (!password) return res.status(400).json({ message: 'Please enter your password' });
			if (password.length < 6)
				return res.status(400).json({ message: 'Password is at least 6 characters long.' });
			// password encryption
			const passwordHash = await bcrypt.hash(password, 12);
			const newUser = { name, email, password: passwordHash };
			const accessToken = createActivationToken(newUser);
			const url = `${CLIENT_URL}/user/active-email/${accessToken}`;
			await sendMail(email, 'Verify your email address', url, name, 'Click to active your email');
			return res.status(200).json({
				message: 'Activate your account',
			});
		} catch (error) {
			console.error(`registerUser Controller::`, error.message);
			next(error);
		}
	},
	loginByGoogle: async (req, res, next) => {
		try {
			const { tokenId } = req.body;
			const verify = await client.verifyIdToken({
				idToken: tokenId,
				audience: GOOGLE_LOGIN_SERVICE_CLIENT_ID,
			});
			const { email_verified, email, name, picture } = verify.payload;
			if (!email_verified) return res.status(400).json({ message: 'Email verification failed.' });
			const user = await User.findOne({ email: email });
			const password = email + GOOGLE_LOGIN_SECRET;
			const passwordHash = await bcrypt.hash(password, 12);
			if (user) {
				const accessToken = await signAccessToken(user._id);
				return res.status(200).json({
					user: user,
					accessToken: accessToken,
				});
			} else {
				const newUser = new User({
					_id: new mongoose.Types.ObjectId(),
					name,
					email,
					password: passwordHash,
					avatar: picture,
				});
				await newUser.save();
				const users = await User.findOne({ email: email });
				const accessToken = await signAccessToken(users._id);
				return res.status(200).json({
					user: users,
					accessToken: accessToken,
				});
			}
		} catch (error) {
			console.error(`loginByGoogle Controller::`, error.message);
			next(error);
		}
	},
	login: async (req, res, next) => {
		try {
			const { email, password } = req.body;
			const user = await User.findOne({ email: email.toLowerCase().trim() });
			if (!user) return res.status(400).json({ message: 'User does not exist' });
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
			const accessToken = await signAccessToken(user);
			const refreshToken = await signRefreshToken(user);
			return res.status(200).json({
				accessToken: accessToken,
				refreshToken: refreshToken,
				user: user,
			});
		} catch (error) {
			console.error(`login Controller::`, error.message);
			next(error);
		}
	},
	getProfile: async (req, res, next) => {
		const user = await User.findById(req.data.id).select('-password');
		if (!user) return res.status(400).json({ message: 'User does not exist.' });
		return res.status(200).json(user);
	},
	refreshToken: async (req, res, next) => {
		try {
			const refreshToken = req.body;
			if (!refreshToken) throw createError.BadRequest();
			const id = await verifyRefreshToken(refreshToken);
			const accessToken = await signAccessToken(id);
			const refToken = await signRefreshToken(id);
			return res.status(200).json({ accessToken: accessToken, refreshToken: refToken });
		} catch (error) {
			console.error(`refreshToken Controller::`, error.message);
			next(error);
		}
	},
	updateUserInfo: async (req, res, next) => {
		try {
			const { id } = req.data;
			const user = await User.findById(id).select('-password');
			if (!user) return res.status(400).json({ message: 'User does not exist.' });
			const updated = await User.findByIdAndUpdate(id, req.body, { new: true });
			return res.status(200).json({
				updated,
			});
		} catch (error) {
			console.error(`updateUserInfo Controller::`, error.message);
			next(error);
		}
	},
	changePassword: async (req, res, next) => {
		try {
			const { email, password } = req.body;
			if (password.length < 6)
				return res.status(400).json({ message: 'Password is at least 6 characters long.' });
			const result = await User.findOne({ email: email });
			const passwordHash = await bcrypt.hash(password, 12);
			await User.findOneAndUpdate(email, { password: passwordHash });
			return res.status(200).json({
				message: 'Password has been changed successfully',
			});
		} catch (error) {
			console.error(`changePassword Controller::`, error.message);
			next(error);
		}
	},
	activeEmail: async (req, res, next) => {
		try {
			const { accessToken } = req.body;
			const user = JWT.verify(accessToken, ACTIVATION_TOKEN_SECRET);
			const { email, password, name } = user;
			const checkEmail = await User.findOne({ email: email });
			if (checkEmail) return res.status(400).json({ message: 'User already exists' });
			const userSave = new User({
				_id: new mongoose.Types.ObjectId(),
				name: name.trim(),
				email: email,
				password: password,
				role: 0,
			});
			const result = await userSave.save();
			const token = await signAccessToken(result._id);
			return res.status(200).json({
				user: result,
				token,
			});
		} catch (error) {
			console.error(`activeEmail Controller::`, error.message);
			next(error);
		}
	},
	forgotPassword: async (req, res, next) => {
		try {
			const { email } = req.body;
			const user = await User.findOne({ email: email.toLowerCase().trim() });
			if (!user) return res.status(400).json({ message: 'Email does not exist' });
			const access_token = createAccessToken({ email: email });
			const url = `${CLIENT_URL}/user/reset-password/${access_token}`;
			await sendMail(
				email,
				'Reset your password',
				url,
				user.name,
				'Click to create a new password'
			);
			return res.status(200).json({ message: 'Create a new password, please check your email' });
		} catch (error) {
			console.error(`forgotPassword Controller::`, error.message);
			next(error);
		}
	},
	resetPassword: async (req, res, next) => {
		try {
			const { password, accessToken } = req.body;
			if (!password) return res.status(400).json({ message: 'Enter your new password' });
			const result = JWT.verify(accessToken, ACTIVATION_TOKEN_SECRET);

			const user = await User.findOne({ email: result.email });
			if (!user) return res.status(400).json({ message: 'User does not exist' });
			const passwordHash = await bcrypt.hash(password, 12);
			await User.findOneAndUpdate({ email: result.email }, { password: passwordHash });
			const token = await signAccessToken(user._id);
			return res.status(200).json({
				user: user,
				token,
			});
		} catch (error) {
			console.error(`resetPassword Controller::`, error.message);
			next(error);
		}
	},
	getUserAddress: async (req, res, next) => {
		const user = await User.findOne({ _id: req.query.id }).exec();
		return res.status(200).json(user.address);
	},
	saveAddress: async (req, res, next) => {
		try {
			const { id } = req.data;
			const user = await User.findOne({ _id: id }).exec();
			const updated = await User.findOneAndUpdate({ email: user.email }, req.body, {
				new: true,
			}).exec();
			return res.status(200).json(updated.address);
		} catch (error) {
			console.error(`saveAddress Controller::`, error.message);
			next(error);
		}
	},
	savePaymentMethod: async (req, res, next) => {
		try {
			const { id } = req.data;
			const user = await User.findOne({ _id: id }).exec();
			const updated = await User.findOneAndUpdate(
				{ email: user.email },
				{ paymentMethod: req.body.paymentMethod },
				{ new: true }
			).exec();
			return res.status(200).json(updated.paymentMethod);
		} catch (error) {
			console.error(`savePaymentMethod Controller::`, error.message);
			next(error);
		}
	},
	applyCoupon: async (req, res, next) => {
		try {
			const { coupon } = req.body;
			const validCoupon = await Coupon.findOne({ name: coupon }).exec();
			if (validCoupon === null || validCoupon.expiry < moment()) {
				return res.status(400).json({
					err: 'Invalid coupon',
				});
			}
			const { id } = req.data;
			const userArray = await User.find({ _id: id }).exec();
			const user = userArray[0];
			let { products, cartTotal } = await Cart.findOne({ orderBy: user._id })
				.populate('products.product', '_id name price')
				.exec();
			// calculate the total after discount
			let totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount) / 100).toFixed(2); // 99.99
			await Cart.findOneAndUpdate(
				{ orderBy: user._id },
				{ totalAfterDiscount },
				{ new: true }
			).exec();
			res.status(200).json({ value: totalAfterDiscount });
		} catch (error) {
			console.error(`applyCoupon Controller::`, error.message);
			next(error);
		}
	},
	addToWishlist: async (req, res, next) => {
		const { params } = req.body;
		const user = await User.findOneAndUpdate(
			{ email: req.user.email },
			{ $addToSet: { wishlist: params } }
		).exec();
		return res.status(200).json({ ok: true });
	},
	wishlist: async (req, res, next) => {
		const list = await User.findOne({ email: req.user.email })
			.select('wishlist')
			.populate('wishlist')
			.exec();
		return res.status(200).json(list);
	},
	removeFromWishlist: async (req, res, next) => {
		const { params } = req.params;
		const user = await User.findOneAndUpdate(
			{ email: req.user.email },
			{ $pull: { wishlist: params } }
		).exec();
		return res.status(200).json({ ok: true });
	},
	getAllUsers: async (req, res, next) => {
		const features = new APIFeatures(User.find({}), req.query).filtering().sorting().paginating();
		const users = await features.query;
		return res.status(200).json(users);
	},
});
