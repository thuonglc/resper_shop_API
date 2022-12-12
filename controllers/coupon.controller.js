('use strict');

const Coupon = require('../models/coupon.model');

var that = (module.exports = {
	getCoupons: async (req, res) => {
		return res.status(200).json(await Coupon.find({}).exec());
	},
	createCoupon: async (req, res) => {
		try {
			const { name, expiry, discount } = req.body;
			return res.status(200).json(await new Coupon({ name, expiry, discount }).save());
		} catch (error) {
			console.error(`createCoupon Controller::`, error.message);
			next(error);
		}
	},
	updateCoupon: async (req, res) => {
		try {
			const { id, name, expiry, discount } = req.body;
			const updated = await Coupon.findOneAndUpdate(
				{ _id: id },
				{ name, expiry, discount },
				{ new: true }
			);
			return res.status(200).json(updated);
		} catch (error) {
			console.error(`updateCoupon Controller::`, error.message);
			next(error);
		}
	},
	deleteCoupon: async (req, res) => {
		try {
			const deleted = await Coupon.findByIdAndDelete({ _id: req.params.id }).exec();
			return res.status(204).json({ message: 'Deleted coupon' });
		} catch (error) {
			console.error(`deleteCoupon Controller::`, error.message);
			next(error);
		}
	},
});
