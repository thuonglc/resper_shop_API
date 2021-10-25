import express from 'express';
import { createSub, deleteSub, getSubs, readSub, updateSub } from '../controllers/subController.js';
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js';
const router = express.Router();

router.post('/sub', verifyAccessToken, verifyAdminRole, createSub);
router.get('/subs', getSubs);
router.get('/sub/:slug', readSub);
router.put('/sub/:slug', verifyAccessToken, verifyAdminRole, updateSub);
router.delete('/sub/:slug', verifyAccessToken, verifyAdminRole, deleteSub);

export default router;
