const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
	createProduct,
	deleteProduct,
	getAllProducts,
	getProductByAdmin,
	getProducts,
	listRelated,
	productsCount,
	readProduct,
	removeImg,
	searchFilters,
	updateProduct,
} = require('../controllers/product.controller');
const { verifyAccessToken, verifyAdminRole } = require('../utils/jwt_helpers');

//cloudinary
let upload = multer({
	storage: multer.diskStorage({}),
	fileFilter: (req, file, cb) => {
		if (!file.mimetype.match(/jpe|jpeg|png|gif$i/)) {
			cb(new Error('File is not supported'), false);
			return;
		}
		cb(null, true);
	},
});

router.get('/v1/api/products/total', productsCount);
router.get('/v1/api/product', getProducts);
router.get('/v1/api/product/:id', readProduct);
router.get('/v1/api/related', listRelated);
router.get('/v1/api/search', searchFilters);

// admin
router.post(
	'/v1/api/admin/product',
	upload.array('image'),
	verifyAccessToken,
	verifyAdminRole,
	createProduct
);
router.get('/v1/api/admin/product', verifyAccessToken, verifyAdminRole, getAllProducts);
router.get('/v1/api/admin/product/:id?', verifyAccessToken, verifyAdminRole, getProductByAdmin);
router.delete('/v1/api/admin/product/:id?', verifyAccessToken, verifyAdminRole, deleteProduct);
router.post('/v1/api/admin/product/remove-image', verifyAccessToken, verifyAdminRole, removeImg);
router.post(
	'/v1/api/admin/product/:id',
	upload.array('image'),
	verifyAccessToken,
	verifyAdminRole,
	updateProduct
);

module.exports = router;
