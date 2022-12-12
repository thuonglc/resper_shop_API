const express = require('express');
const router = express.Router();
const {
	createSub,
	deleteSub,
	getSubs,
	readSub,
	updateSub,
} = require('../controllers/sub.controller');
const { verifyAccessToken, verifyAdminRole } = require('../utils/jwt_helpers');

router.post('/v1/api/sub', verifyAccessToken, verifyAdminRole, createSub);
router.get('/v1/api/sub', getSubs);
router.get('/v1/api/sub/:id', readSub);
router.patch('/v1/api/sub/:id?', verifyAccessToken, verifyAdminRole, updateSub);
router.delete('/v1/api/sub/:id?', verifyAccessToken, verifyAdminRole, deleteSub);

module.exports = router;
