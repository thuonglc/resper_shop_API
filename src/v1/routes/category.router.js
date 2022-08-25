const express = require('express');
const router = express.Router();

const {
	createCategory,
	deleteCategory,
	getCategories,
	getCategorySubs,
	readCategory,
	updateCategory,
} = require('../controllers/category.controller');
const { verifyAccessToken, verifyAdminRole } = require('../utils/jwt_helpers');

router.get('/v1/api/category', getCategories);
router.get('/v1/api/category/:id', readCategory);
router.get('/v1/api/category/subs/:id?', getCategorySubs);
router.post('/v1/api/category', verifyAccessToken, verifyAdminRole, createCategory);
router.patch('/v1/api/category/:id?', verifyAccessToken, verifyAdminRole, updateCategory);
router.delete('/v1/api/category/:id?', verifyAccessToken, verifyAdminRole, deleteCategory);

module.exports = router;
