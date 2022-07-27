import express from 'express'
import multer from 'multer'
import {
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
} from '../controllers/productController.js'
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js'

const router = express.Router()

//cloudinary
let upload = multer({
	storage: multer.diskStorage({}),
	fileFilter: (req, file, cb) => {
		if (!file.mimetype.match(/jpe|jpeg|png|gif$i/)) {
			cb(new Error('File is not supported'), false)
			return
		}

		cb(null, true)
	},
})

router.get('/products/total', productsCount)
router.get('/product', getProducts)
router.get('/product/:id', readProduct)

// admin
router.post(
	'/admin/product',
	upload.array('image'),
	verifyAccessToken,
	verifyAdminRole,
	createProduct
)
router.get('/admin/product', verifyAccessToken, verifyAdminRole, getAllProducts)
router.get('/admin/product/:id?', verifyAccessToken, verifyAdminRole, getProductByAdmin)
router.delete('/admin/product/:id?', verifyAccessToken, verifyAdminRole, deleteProduct)
router.post('/admin/product/remove-image', verifyAccessToken, verifyAdminRole, removeImg)
router.post(
	'/admin/product/:id',
	upload.array('image'),
	verifyAccessToken,
	verifyAdminRole,
	updateProduct
)

// related
router.get('/related', listRelated)

// search
router.get('/search', searchFilters)

export default router
