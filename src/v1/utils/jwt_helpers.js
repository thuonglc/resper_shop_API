('use strict');

const User = require('../models/user.model');
const JWT = require('jsonwebtoken');
const createError = require('http-errors');

var that = (module.exports = {
	signAccessToken: (id) => {
		return new Promise((resolve, reject) => {
			const options = {
				expiresIn: '30d',
			};
			JWT.sign({ id }, process.env.ACCESS_TOKEN_SECRET, options, (err, token) => {
				if (err) reject(createError.InternalServerError());
				resolve(token);
			});
		});
	},
	signRefreshToken: (id) => {
		return new Promise((resolve, reject) => {
			const options = {
				// expiresIn: '16s',
			};
			JWT.sign({ id }, process.env.REFRESH_TOKEN_SECRET, options, (err, token) => {
				if (err) reject(createError.InternalServerError());
				resolve(token);
			});
		});
	},
	verifyRefreshToken: (refreshToken) => {
		return new Promise((resolve, reject) => {
			JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
				if (err) return next(createError.Unauthorized());
			});
		});
	},
	verifyAccessToken: (req, res, next) => {
		const token = req.headers.authorization.split(' ')[1];
		if (!token) return next(createError.Unauthorized());
		try {
			req.data = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
			next();
		} catch {
			res.status(400).send('Invalid token');
		}
	},
	verifyAdminRole: async (req, res, next) => {
		const { email } = req.data.id;
		const adminUser = await User.findOne({ email }).exec();
		if (adminUser.role !== 1) {
			res.status(403).json({
				err: 'Admin resource. Access denied.',
			});
		} else {
			next();
		}
	},
});
