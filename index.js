const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const JWT = require('jsonwebtoken');
const moment = require('moment');
const compression = require('compression');
const responseTime = require('response-time');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// models
const Comment = require('./models/comment.model');
const Product = require('./models/product.model');
const User = require('./models/user.model');

// App
const app = express();
const server = createServer(app);

//init dbs
require('./databases/init.mongodb');

//user middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(responseTime());

if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

// compress responses
app.use(
	compression({
		level: 6,
		threshold: 100 * 1000, // compress if the size is over 100kb
		filter: (req, res) => {
			if (req.headers['x-no-compress']) {
				return false;
			}
			return compression.filter(req, res);
		},
	})
);
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// router
app.use(require('./api/cart.router'));
app.use(require('./api/category.router'));
app.use(require('./api/cloudinary.router'));
app.use(require('./api/comment.router'));
app.use(require('./api/coupon.router'));
app.use(require('./api/index.router'));
app.use(require('./api/order.router'));
app.use(require('./api/product.router'));
app.use(require('./api/sub.router'));
app.use(require('./api/user.router'));

// SocketIO
const io = new Server(server, {
	cors: {
		origin: process.env.REACT_APP_API_URL,
		methods: ['GET', 'POST', 'DELETE', 'PUT'],
		allowedHeaders: [
			'Access-Control-Allow-Origin',
			'Access-Control-Header',
			'Origin, X-Requested-With, Content-Type, Accept, Authorization',
			'Access-Control-Allow-Methods',
		],
		credentials: true,
	},
});

let userComment = [];
let countUserOnline = [];
io.on('connection', function (socket) {
	console.log('We have new connection', socket.id);
	socket.on('joinRoom', (id) => {
		const user = { userId: socket.id, room: id };
		const check = userComment.every((user) => user.userId !== socket.id);
		if (check) {
			userComment.push(user);
			socket.join(user.room);
		} else {
			userComment.map((user) => {
				if (user.userId === socket.id) {
					if (user.room !== id) {
						socket.leave(user.room);
						socket.join(id);
						user.room = id;
					}
				}
			});
		}
	});
	// Count online user
	socket.on('countUserOnline', (id) => {
		try {
			const user = { userId: socket.id, room: id };
			const check = countUserOnline.every((user) => user.userId !== socket.id);
			if (check) {
				countUserOnline.push(user);
				socket.join(user.room);
			}
			io.sockets.emit('severCountUserOnline', countUserOnline.length);
		} catch (error) {
			console.log(error);
		}
	});
	// Create comment
	socket.on('userCreateComment', async (msg) => {
		try {
			const timeComment = moment().format();
			const { id_product, content, start, token, send, idComment, idUser } = msg;
			const result = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(result.id);
			if (user) {
				const product = await Product.findById(id_product);
				const array_product = {
					_id: product._id,
					image: product.image[0].url,
					category: product.category,
					brand: product.brand,
					name: product.name,
				};
				const newComment = new Comment({
					_id: new mongoose.Types.ObjectId(),
					id_product,
					array_product,
					content,
					start,
					timeComment: timeComment,
					id_user: user._id,
					name: user.name,
					role: user.role,
					avatar: user.avatar,
					editComment: false,
				});
				const num = product.numReviews;
				const rate = product.rating;
				const options = { new: true };
				const data = {
					rating: start > 0 ? rate + start : rate,
					numReviews: start > 0 ? num + 1 : num,
				};
				await Product.findByIdAndUpdate(id_product, data, options);
				if (send === 'repLyComment') {
					const commentReply = new Comment({
						_id: new mongoose.Types.ObjectId(),
						id_product,
						array_product,
						content,
						timeComment: timeComment,
						id_user: user._id,
						name: user.name,
						role: user.role,
						avatar: user.avatar,
						editComment: false,
					});
					const comment = await Comment.findById(idComment);
					if (comment) {
						const {
							_id,
							id_product,
							content,
							timeComment,
							id_user,
							name,
							role,
							avatar,
							editComment,
						} = commentReply;
						comment.reply.push({
							role,
							_id,
							id_product,
							content,
							start: 0,
							timeComment,
							id_user,
							name,
							avatar,
							editComment,
						});
						await comment.save();
						io.to(comment.id_product).emit('ServerUserCreateCommentReply', comment);
					}
				} else {
					await newComment.save();
					const products = await Product.findById(id_product);
					const dataComments = await Comment.find({ id_product: id_product });
					const oneStarsResult = await Comment.find({ id_product: id_product, start: 1 });
					const twoStarsResult = await Comment.find({ id_product: id_product, start: 2 });
					const threeStarsResult = await Comment.find({ id_product: id_product, start: 3 });
					const fourStarsResult = await Comment.find({ id_product: id_product, start: 4 });
					const fiveStarsResult = await Comment.find({ id_product: id_product, start: 5 });
					const sumStarRating =
						oneStarsResult.length +
						twoStarsResult.length +
						threeStarsResult.length +
						fourStarsResult.length +
						fiveStarsResult.length;
					const starRating = {
						oneStars: oneStarsResult.length,
						twoStars: twoStarsResult.length,
						threeStars: threeStarsResult.length,
						fourStars: fourStarsResult.length,
						fiveStars: fiveStarsResult.length,
					};
					const resultData = {
						length: dataComments.length,
						comment: newComment,
						product: products,
						reviewRating:
							sumStarRating > 0 && products.rating > 0 ? products.rating / sumStarRating : 0,
						starRating: starRating,
						sumStarRating: sumStarRating,
					};
					io.to(newComment.id_product).emit('ServerUserCreateComment', resultData);
				}
			} else {
				const noUsers = {
					accountDelete: true,
					_id_user: idUser,
				};
				io.sockets.emit('serverDeleteAccount', noUsers);
			}
		} catch (err) {
			console.log('SocketIO', err);
		}
	});
	// Delete comment
	socket.on('userDeleteComment', async (msg) => {
		try {
			const { _id, id_product, token, idUser } = msg;
			const result = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(result.id);
			const dataReply = await Comment.find({ id_product: id_product });
			if (user) {
				const comment = await Comment.findByIdAndDelete(_id);
				const product = await Product.findById(id_product);
				//delete have reply
				if (dataReply) {
					for (let index = 0; index < dataReply.length; index++) {
						const reply = Array.from(dataReply[index].reply);
						if (reply.length > 0) {
							for (let j = 0; j < reply.length; j++) {
								const element = reply[j];
								if (element._id == _id) {
									reply.splice(j, 1);
									const id_array = dataReply[index]._id;
									const sendReply = await Comment.findByIdAndUpdate(
										id_array,
										{ reply: reply },
										{ new: true }
									);
									const data = {
										id_array: id_array,
										comment: sendReply,
									};
									io.to(sendReply.id_product).emit('serverUserDeleteReplyComment', data);
									break;
								}
							}
						}
					}
				}
				// Delete no reply
				if (comment) {
					const num = product.numReviews;
					const rate = product.rating;
					const start_cmt = comment.start;
					const options = { new: true };
					const data = {
						rating: start_cmt > 0 ? rate - start_cmt : rate,
						numReviews: start_cmt > 0 ? num - 1 : num,
					};
					await Product.findByIdAndUpdate(id_product, data, options);
					const dataComments = await Comment.find({ id_product: id_product });
					const products = await Product.findById(id_product);
					const oneStarsResult = await Comment.find({ id_product: id_product, start: 1 });
					const twoStarsResult = await Comment.find({ id_product: id_product, start: 2 });
					const threeStarsResult = await Comment.find({ id_product: id_product, start: 3 });
					const fourStarsResult = await Comment.find({ id_product: id_product, start: 4 });
					const fiveStarsResult = await Comment.find({ id_product: id_product, start: 5 });
					const sumStarRating =
						oneStarsResult.length +
						twoStarsResult.length +
						threeStarsResult.length +
						fourStarsResult.length +
						fiveStarsResult.length;
					const starRating = {
						oneStars: oneStarsResult.length,
						twoStars: twoStarsResult.length,
						threeStars: threeStarsResult.length,
						fourStars: fourStarsResult.length,
						fiveStars: fiveStarsResult.length,
					};
					const resultData = {
						length: dataComments.length,
						comment: comment,
						product: products,
						reviewRating:
							sumStarRating > 0 && products.rating > 0 ? products.rating / sumStarRating : 0,
						starRating: starRating,
						sumStarRating: sumStarRating,
					};
					io.to(comment.id_product).emit('serverUserDeleteComment', resultData);
				}
			} else {
				const noUsers = {
					accountDelete: true,
					_id_user: idUser,
				};
				io.sockets.emit('serverDeleteAccount', noUsers);
			}
		} catch (error) {
			console.log(error);
		}
	});
	// Update comment
	socket.on('userUpdateComment', async (msg) => {
		try {
			const { content, start, token, idUser, idProduct, _id } = msg;
			const result = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(result.id);
			if (user) {
				const createdAt = new Date().toISOString();
				const product = await Product.findById(idProduct);
				const comment = await Comment.findById(_id);
				const options = { new: true };
				const dataReply = await Comment.find({ id_product: idProduct });
				// Update reply
				if (dataReply) {
					for (let index = 0; index < dataReply.length; index++) {
						const reply = Array.from(dataReply[index].reply);
						if (reply.length > 0) {
							for (let j = 0; j < reply.length; j++) {
								const element = reply[j];
								if (element._id == _id) {
									element.content = content;
									element.editComment = true;
									const id_array = dataReply[index]._id;
									const sendReply = await Comment.findByIdAndUpdate(
										id_array,
										{ reply: reply },
										options
									);
									io.to(sendReply.id_product).emit('serverUserUpdateReplyComment', sendReply);
									break;
								}
							}
						}
					}
				}
				// Update no reply
				if (comment) {
					const newComment = {
						content: content.trim(),
						start,
						editComment: true,
						timeComment: createdAt,
					};
					const rateOld = product.rating;
					const resultComment = await Comment.findByIdAndUpdate(_id, newComment, options);
					const startOld = start > 0 ? comment.start : start;
					const resultStart = start > 0 ? startOld - start : start;
					const newProduct = {
						rating:
							resultStart > 0 ? rateOld - Math.abs(resultStart) : rateOld + Math.abs(resultStart),
					};
					await Product.findByIdAndUpdate(idProduct, newProduct, options);
					const products = await Product.findById(idProduct);
					const oneStarsResult = await Comment.find({ id_product: idProduct, start: 1 });
					const twoStarsResult = await Comment.find({ id_product: idProduct, start: 2 });
					const threeStarsResult = await Comment.find({ id_product: idProduct, start: 3 });
					const fourStarsResult = await Comment.find({ id_product: idProduct, start: 4 });
					const fiveStarsResult = await Comment.find({ id_product: idProduct, start: 5 });
					const sumStarRating =
						oneStarsResult.length +
						twoStarsResult.length +
						threeStarsResult.length +
						fourStarsResult.length +
						fiveStarsResult.length;
					const starRating = {
						oneStars: oneStarsResult.length,
						twoStars: twoStarsResult.length,
						threeStars: threeStarsResult.length,
						fourStars: fourStarsResult.length,
						fiveStars: fiveStarsResult.length,
					};
					const resultData = {
						comment: resultComment,
						product: products,
						reviewRating:
							sumStarRating > 0 && products.rating > 0 ? products.rating / sumStarRating : 0,
						starRating: starRating,
						sumStarRating: sumStarRating,
					};
					io.to(resultComment.id_product).emit('serverUserUpdateComment', resultData);
				}
			} else {
				const noUsers = {
					accountDelete: true,
					_id_user: idUser,
				};
				io.sockets.emit('serverDeleteAccount', noUsers);
			}
		} catch (error) {
			console.log('SocketIO', error);
		}
	});
	// When write comment
	socket.on('waitWriteComment', (msg) => {
		const { idProduct, message } = msg;
		socket.to(idProduct).emit('waitWriteComment', message);
	});
	// Upload information
	socket.on('userUpdateInformation', async (msg) => {
		try {
			const { token, name, idUser } = msg;
			const result = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(result.id);
			if (user) {
				const options = { new: true };
				const data = { name: name };
				const resultUser = await User.findByIdAndUpdate(result.id, data, options);
				await Comment.updateMany({ id_user: result.id }, { name: name }, options);
				const dataReply = await Comment.find();
				for (let index = 0; index < dataReply.length; index++) {
					const reply = Array.from(dataReply[index].reply);
					if (reply.length > 0) {
						for (let j = 0; j < reply.length; j++) {
							const element = reply[j];
							if (element.id_user === idUser) {
								element.name = name;
								const id_array = dataReply[index]._id;
								await Comment.findByIdAndUpdate(id_array, { reply: reply }, options);
							}
						}
					}
				}
				const resultData = {
					user: resultUser,
					id_user: idUser,
				};
				io.sockets.emit('serverUpdateInformation', resultData);
			}
		} catch (err) {
			console.log('SocketIO', err);
		}
	});
	// Upload image
	socket.on('userUploadAvatar', (msg) => {
		const { avatar, idUser } = msg;
		const resultData = {
			userId: idUser,
			user: avatar,
		};
		io.sockets.emit('serverUserUploadAvatar', resultData);
	});

	socket.on('disconnect', () => {
		console.log(socket.id + ' disconnected.');
		userComment = userComment.filter((user) => user.userId !== socket.id);
		countUserOnline = countUserOnline.filter((user) => user.userId !== socket.id);
		io.sockets.emit('severCountUserOnline', countUserOnline.length);
	});
});

// Error Handling Middleware called

app.use((req, res, next) => {
	const error = new Error('Not found');
	error.status = 404;
	next(error);
});

// error handler middleware
app.use((error, req, res, next) => {
	res.status(error.status || 500).send({
		error: {
			status: error.status || 500,
			message: error.message || 'Internal Server Error',
		},
	});
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
