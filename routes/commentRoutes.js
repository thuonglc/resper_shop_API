import express from 'express';
import { deleteIdComment, getIdProduct, historyComment } from '../controllers/commentController.js';
import { verifyAccessToken } from '../utils/jwt_helpers.js';
const router = express.Router();

router.route('/comments/get-comments').get(getIdProduct);
router.route('/comments/delete-comments').delete(verifyAccessToken, deleteIdComment);
router.route('/comments/history-comments').get(verifyAccessToken, historyComment);

export default router;
