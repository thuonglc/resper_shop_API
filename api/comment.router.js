const express = require('express');
const router = express.Router();
const {
	deleteIdComment,
	getIdProduct,
	historyComment,
} = require('../controllers/comment.controller');
const { verifyAccessToken } = require('../utils/jwt_helpers');

router.get('/v1/api/comments/get-comments', getIdProduct);
router.delete('/v1/api/comments/delete-comments', verifyAccessToken, deleteIdComment);
router.get('/v1/api/comments/history-comments', verifyAccessToken, historyComment);

module.exports = router;
