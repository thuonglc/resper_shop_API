import bcrypt from 'bcryptjs';
import moment from 'moment';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema;

const createdAt = moment().format();

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      default: 0,
    }, //  0 = user , 1 = admin
    avatar: {
      type: String,
      default:
        'https://res.cloudinary.com/dfxk0fqfp/image/upload/v1626342034/watchshopstorage/default-avatar-profile-icon-vector-social-media-user-portrait-176256935_qy5m6a.jpg',
    },
    createdAt: {
      type: String,
      default: createdAt,
    },
    cart: {
      type: Array,
      default: [],
    },
    address: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      default: '',
    },
    wishlist: [{ type: ObjectId, ref: 'Product' }],
  },

  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
