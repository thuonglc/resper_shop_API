import express from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategorySubs,
  readCategory,
  updateCategory,
} from '../controllers/categoryController.js';
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js';
const router = express.Router();

router.get('/categories', getCategories);
router.get('/category/:slug', readCategory);
router.get('/category/subs/:_id', getCategorySubs);
router.post('/category', verifyAccessToken, verifyAdminRole, createCategory);
router.put('/category/:slug', verifyAccessToken, verifyAdminRole, updateCategory);
router.delete('/category/:slug', verifyAccessToken, verifyAdminRole, deleteCategory);

export default router;
