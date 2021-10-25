import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema;
const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, text: true },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: { type: String, required: true, text: true },
    price: { type: Number, trim: true, required: true, maxlength: 32 },
    category: {
      type: ObjectId,
      ref: 'Category',
    },
    subs: [
      {
        type: ObjectId,
        ref: 'Sub',
      },
    ],
    // user: {
    //   type: ObjectId,
    //   required: true,
    //   ref: 'User',
    // },
    quantity: { type: Number, required: true, default: 100 },
    sold: { type: Number, default: 0 },
    image: {
      type: Array,
    },
    shipping: {
      type: String,
      enum: ['Yes', 'No'],
    },
    color: {
      type: Array,
      default: null,
    },
    brand: {
      type: String,
      default: null,
    },
    rating: { type: Number, default: 0 },
    // required
    priceCompare: { type: Number, required: true },
    numReviews: { type: Number, default: 0 },
    //not required
    //0. smartphone
    type: { type: String, default: null },
    sc: { type: String, default: null },
    ram: { type: Array, default: [] },
    rom: { type: Array, default: [] },

    //1. laptop
    // sc: { type: String },
    // ra: { type: String },
    // ro: { type: String },
    res: { type: String, default: null },
    cpu: { type: String, default: null },

    //2. tablet
    // sc: { type: String },
    // ra: { type: String },
    // ro: { type: String },

    //3. watch
    sex: { type: Array, default: null }, //both
    pin: { type: String, default: null }, //both
    face: { type: String, default: null }, //both
  },
  { timestamp: true }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
