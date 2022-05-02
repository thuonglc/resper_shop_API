import express from 'express'
import multer from 'multer'
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getProducts,
	listRelated,
	productsCount,
	readProduct,
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

router.post('/product', upload.array('image'), verifyAccessToken, verifyAdminRole, createProduct)
router.get('/products/total', productsCount)
router.get('/product', getProducts)
router.get('/admin/product', getAllProducts)
router.get('/product/:id', readProduct)
router.delete('/product/:id?', verifyAccessToken, verifyAdminRole, deleteProduct)
router.patch(
	'/product/:id?',
	upload.array('image'),
	verifyAccessToken,
	verifyAdminRole,
	updateProduct
)

// related
router.get('/related', listRelated)

// search
router.get('/search/filters', searchFilters)

export default router
