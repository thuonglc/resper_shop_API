import Coupon from '../models/couponModel.js'

const getCoupons = async (req, res) => {
	try {
		res.json(await Coupon.find({}).exec())
	} catch (err) {
		return res.status(500).json({ msg: err.message })
	}
}

const createCoupon = async (req, res) => {
	try {
		const { name, expiry, discount } = req.body
		res.json(await new Coupon({ name, expiry, discount }).save())
	} catch (err) {
		return res.status(500).json({ msg: err.message })
	}
}

const updateCoupon = async (req, res) => {
	const { id, name, expiry, discount } = req.body
	try {
		const updated = await Coupon.findOneAndUpdate(
			{ _id: id },
			{ name, expiry, discount },
			{ new: true }
		)
		res.json(updated)
	} catch (err) {
		return res.status(500).json({ msg: err.message })
	}
}

const deleteCoupon = async (req, res) => {
	try {
		const deleted = await Coupon.findByIdAndDelete({ _id: req.params.id }).exec()
		res.json(deleted)
	} catch (err) {
		return res.status(500).json({ msg: err.message })
	}
}

export { getCoupons, createCoupon, deleteCoupon, updateCoupon }
