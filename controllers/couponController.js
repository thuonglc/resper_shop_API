import Coupon from '../models/couponModel.js';

const getCoupons = async (req, res) => {
  try {
    res.json(await Coupon.find({}).sort({ createdAt: -1 }).exec());
  } catch (err) {
    console.log(err);
  }
};

const createCoupon = async (req, res) => {
  try {
    const { name, expiry, discount } = req.body;
    res.json(await new Coupon({ name, expiry, discount }).save());
  } catch (err) {
    console.log(err);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    res.json(await Coupon.findByIdAndDelete(req.params.couponId).exec());
  } catch (err) {
    console.log(err);
  }
};

export { getCoupons, createCoupon, deleteCoupon };
