import mongoose from 'mongoose';

const commentSchema = mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  id_product: { type: String, required: true },
  array_product: { type: Array, required: true },
  content: { type: String, required: true },
  start: { type: Number },
  reply: { type: Array },
  editComment: { type: Boolean, required: false },
  timeComment: { type: String, required: true },
  id_user: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, required: true },
  role: { type: Number, default: 0 },
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
