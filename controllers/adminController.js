import createError from 'http-errors';
import moment from 'moment';
// model
import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';

const fs = require('fs');
class ApiFeatures {
  constructor(query) {
    this.query = query;
  }
  sortCart() {
    this.query = this.query.sort('-timeCart');
    return this;
  }
  sortProduct() {
    this.query = this.query.sort('-createdAt');
    return this;
  }
  sortUser() {
    this.query = this.query.sort('-createdAt');
    return this;
  }
  sortingComment() {
    this.query = this.query.sort('-timeComment');
    return this;
  }
}

const getAllOrders = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const currentPage = page || 1;
    const perPage = limit || 20;
    const orders = await Order.find({})
      .skip((currentPage - 1) * perPage)
      .limit(Number(perPage))
      .populate('products.product', '_id name image')
      .exec();
    let total = await Order.find({}).estimatedDocumentCount().exec();
    res.json({
      length: total,
      orders: orders,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const orderStatus = async (req, res) => {
  const { orderId, orderStatus } = req.body;
  let updated = await Order.findByIdAndUpdate(orderId, { orderStatus }, { new: true }).exec();
  res.json(updated);
};
// const deleteProduct = async (req, res) => {
//   try {
//     const { id_product } = req.query;
//     const { id } = req.data;
//     const user = await User.find({ _id: id, role: 1 });
//     if (user.length > 0) {
//       const result = await Product.findByIdAndDelete(id_product);
//       res.status(200).json({
//         message: 'delete success',
//         product: result,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

// module.exports = {
//   // ----------------------------products----------------------
//   DELETE_PRODUCTS: async (req, res) => {
//     try {
//       const { id_product } = req.query;
//       const { id } = req.data;
//       const user = await User.find({ _id: id, role: 1 });
//       if (user.length > 0) {
//         const result = await Product.findByIdAndDelete(id_product);
//         res.status(200).json({
//           message: 'delete success',
//           product: result,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   UPDATE_PRODUCT: async (req, res) => {
//     try {
//       const { id } = req.data;
//       const user = await User.find({ _id: id, role: 1 });
//       const product = JSON.parse(req.body.product);
//       const imageNew = req.files;
//       const urls = [];
//       const {
//         name,
//         size,
//         price,
//         sex,
//         description,
//         collections,
//         color,
//         productType,
//         key,
//         NSX,
//         imageOld,
//         id_product,
//       } = product;
//       if (user.length > 0) {
//         // check if have image new put img old in image new
//         if (imageNew.length > 0) {
//           const uploader = async (path) => await cloudinary.uploads(path, 'poster');
//           for (const file of imageNew) {
//             const { path } = file;
//             const newPath = await uploader(path);
//             urls.push(newPath);
//             fs.unlinkSync(path);
//           }
//           for (let index = 0; index < imageOld.length; index++) {
//             const element = imageOld[index];
//             urls.unshift(element);
//           }
//         }
//         const options = { new: true };
//         const dataUpdate = {
//           name: name.trim(),
//           size,
//           price,
//           sex: sex.trim(),
//           poster: urls.length > 0 ? urls : imageOld,
//           color,
//           description: description.trim(),
//           productType: productType.trim(),
//           description: description.trim(),
//           collections: collections.trim(),
//           // numReviews: 0,
//           // rating: 0,
//           key,
//           NSX,
//         };
//         const resultProduct = await Product.findByIdAndUpdate(id_product, dataUpdate, options);
//         res.status(200).json({
//           message: 'update successful',
//           product: resultProduct,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   ADD_PRODUCTS: async (req, res) => {
//     try {
//       const { id } = req.data;
//       const user = await User.find({ _id: id, role: 1 });
//       const posterData = req.files;
//       const product = JSON.parse(req.body.product);
//       const urls = [];
//       if (user.length > 0) {
//         const { name, size, price, sex, description, collections, color, productType, key, NSX } =
//           product;
//         const uploader = async (path) => await cloudinary.uploads(path, 'poster');
//         for (const file of posterData) {
//           const { path } = file;
//           const newPath = await uploader(path);
//           urls.push(newPath);
//           fs.unlinkSync(path);
//         }
//         const newProduct = new Product({
//           _id: new mongoose.Types.ObjectId(),
//           name: name.trim(),
//           size,
//           price,
//           sex: sex.trim(),
//           poster: urls,
//           color,
//           description: description.trim(),
//           productType: productType.trim(),
//           description: description.trim(),
//           collections: collections.trim(),
//           key,
//           NSX,
//         });
//         const result = await newProduct.save();
//         res.status(200).json({
//           message: 'image upload successful',
//           product: result,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   LIST_PRODUCT: async (req, res) => {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 5;
//       const start = (page - 1) * limit;
//       const end = start + limit;
//       const features = new ApiFeatures(Product.find({}, { __v: 0 }), req.query).sortProduct();
//       const productAll = await Product.find({}, { __v: 0 });
//       const lengthProducts = productAll.length;
//       const products = await features.query;
//       const resultProducts = products.slice(start, end);
//       res.status(200).json({
//         status: 'success',
//         start: start,
//         end: end,
//         limit: limit,
//         length: lengthProducts,
//         product: resultProducts,
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   //----------------------------Cart----------------------------
//   MESSAGES_CART_ERROR: async (req, res) => {
//     try {
//       const { id } = req.data;
//       const { id_cart } = req.query;
//       const user = await User.find({ _id: id, role: 1 });
//       const options = { new: true };
//       const data = {
//         message: req.body.message,
//       };
//       if (user.length > 0) {
//         const resultCart = await Cart.findByIdAndUpdate(id_cart, data, options);
//         res.status(200).json({
//           message: 'update success',
//           cart: resultCart,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   DELETE_CART: async (req, res) => {
//     try {
//       const { id_cart } = req.query;
//       const { id } = req.data;
//       const user = await User.find({ _id: id, role: 1 });
//       if (user.length > 0) {
//         const searchCart = await Cart.findById(id_cart);
//         if (!searchCart) {
//           res.send(createError(404, 'no id cart'));
//         }
//         const deleteCart = await Cart.findByIdAndDelete(id_cart);
//         const cart = await Cart.find({}, {});
//         if (!deleteCart) {
//           res.send(createError(404, 'no cart'));
//         }
//         res.status(200).json({
//           status: 'delete success',
//           cart: deleteCart,
//           length: cart.length,
//         });
//       }
//     } catch (error) {
//       console.log({ error });
//     }
//   },
//   CHECK_OUT_CARD: async (req, res) => {
//     try {
//       const { id } = req.data;
//       const user = await User.find({ _id: id, role: 1 });
//       const { id_cart } = req.query;
//       const options = { new: true };
//       const data = {
//         success: true,
//         message: '',
//       };
//       if (user.length > 0) {
//         const result = await Cart.findByIdAndUpdate(id_cart, data, options);
//         res.status(200).json({
//           cart: result,
//         });
//       } else {
//         res.send(createError(404, 'no Cart found'));
//       }
//     } catch (error) {
//       res.send(createError(404, 'no Cart found'));
//     }
//   },
//   LIST_CARD: async (req, res) => {
//     try {
//       const { id } = req.data;
//       const user = await User.find({ _id: id, role: 1 });
//       const { success, status_order } = req.query || '';
//       if (user.length > 0) {
//         // đã phê duyệt
//         if (success === 'true' && status_order === 'true') {
//           const features = new ApiFeatures(
//             Cart.find({ success: true, status_order: true }),
//             req.query
//           ).sortCart();
//           const list_card = await features.query;
//           res.status(200).json({
//             length: list_card.length,
//             cart: list_card,
//           });
//         }
//         if (success === 'false' && status_order === 'false') {
//           // giỏ hàng đã hủy
//           const features = new ApiFeatures(
//             Cart.find({ success: false, status_order: false }, {}),
//             req.query
//           ).sortCart();
//           const list_card = await features.query;
//           res.status(200).json({
//             length: list_card.length,
//             cart: list_card,
//           });
//         }
//         if (success === 'false' && status_order === 'true') {
//           // chờ phê duyệt
//           const features = new ApiFeatures(
//             Cart.find({ success: false, status_order: true }),
//             req.query
//           ).sortCart();
//           const list_card = await features.query;
//           res.status(200).json({
//             length: list_card.length,
//             cart: list_card,
//           });
//         } else {
//           // tất cả giỏ hàng
//           const features = new ApiFeatures(Cart.find({}, {}), req.query).sortCart();
//           const list_card = await features.query;
//           res.status(200).json({
//             length: list_card.length,
//             cart: list_card,
//           });
//         }
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   GET_USER: async (req, res) => {
//     try {
//       const { id } = req.data;
//       const admin = await User.find({ _id: id, role: 1 });
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 5;
//       const start = (page - 1) * limit;
//       const end = start + limit;
//       const userAll = await User.find({}, { password: 0 });
//       for (let i = 0; i < userAll.length; i++) {
//         const id_user = userAll[i].id;
//         const length_data = await Comment.find({ id_user: id_user });
//         userAll[i].__v = length_data.length;
//       }
//       const resultUsers = userAll.slice(start, end);
//       if (admin.length > 0) {
//         res.status(200).json({
//           status: 'success',
//           start: start,
//           end: end,
//           limit: limit,
//           length: userAll.length,
//           user: resultUsers,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   //----------------------------user----------------------------
//   LIST_COMMENTS_USERS: async (req, res) => {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 5;
//       const start = (page - 1) * limit;
//       const end = start + limit;
//       const { id } = req.data;
//       const { id_user } = req.query;
//       const admin = await User.find({ _id: id, role: 1 });
//       const features = new ApiFeatures(
//         Comment.find({ id_user: id_user }),
//         req.query
//       ).sortingComment();
//       const list_comments = await features.query;
//       const length_data = await Comment.find({ id_user: id_user });
//       const result_comments = list_comments.slice(0, end);
//       if (admin.length > 0 && id_user) {
//         res.status(200).json({
//           status: 'success',
//           start: 0,
//           end: end,
//           limit: limit,
//           length: length_data.length,
//           comment: result_comments,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   DELETE_COMMENT_USERS: async (req, res) => {
//     try {
//       const { _id_comment, _id_product, _id_user } = req.query;
//       const { id } = req.data;
//       const admin = await User.find({ _id: id, role: 1 });
//       if (admin.length > 0) {
//         const comment = await Comment.findByIdAndDelete(_id_comment);
//         const product = await Product.findById(_id_product);
//         let num = product.numReviews;
//         let rate = product.rating;
//         let start_cmt = comment.start;
//         if (start_cmt > 0) {
//           const options = { new: true };
//           const data = {
//             rating: rate - start_cmt,
//             numReviews: num - 1,
//           };
//           await Product.findByIdAndUpdate(_id_product, data, options);
//         }
//         const dataComments = await Comment.find({ id_user: _id_user });
//         res.status(200).json({
//           status: 'delete success',
//           length: dataComments.length,
//           id_comment: _id_comment,
//           id_user: _id_user,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   },
//   DELETE_ACCOUNT_USER: async (req, res) => {
//     try {
//       const { _id_user } = req.query;
//       const { id } = req.data;
//       const admin = await User.find({ _id: id, role: 1 });
//       const user = await User.findById(_id_user);
//       const commentUser = await Comment.find({ id_user: _id_user });
//       const commentUserReply = await Comment.find();
//       if (admin.length > 0 && user) {
//         //delete no reply
//         if (commentUser.length > 0) {
//           for (let index = 0; index < commentUser.length; index++) {
//             const _idComment = commentUser[index]._id;
//             const idProduct = commentUser[index].id_product;
//             const product = await Product.findById(idProduct);
//             const comment = await Comment.findByIdAndDelete(_idComment);
//             let num = product.numReviews;
//             let rate = product.rating;
//             let start_cmt = comment.start;
//             if (start_cmt > 0) {
//               const options = { new: true };
//               const data = {
//                 rating: rate - start_cmt,
//                 numReviews: num - 1,
//               };
//               await Product.findByIdAndUpdate(idProduct, data, options);
//             }
//             await Comment.findByIdAndDelete(_idComment);
//           }
//         }
//         // delete reply
//         if (commentUserReply.length > 0) {
//           for (let j = 0; j < commentUserReply.length; j++) {
//             const arrayReply = Array.from(commentUserReply[j].reply);
//             if (arrayReply.length > 0) {
//               for (let i_reply = 0; i_reply < arrayReply.length; i_reply++) {
//                 if (arrayReply[i_reply].id_user === _id_user) {
//                   arrayReply.splice(i_reply, 1);
//                   let id_reply = commentUserReply[j]._id;
//                   await Comment.findByIdAndUpdate(id_reply, { reply: arrayReply }, { new: true });
//                 }
//               }
//             }
//           }
//         }
//         await User.findByIdAndDelete(_id_user);
//         res.status(200).json({
//           message: 'delete account success',
//           id_user: _id_user,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   },
// };

export { getAllOrders, orderStatus };
