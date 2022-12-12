const express = require('express');
const router = express.Router();

const { removes } = require('../utils/cloudinary');
const { verifyAccessToken, verifyAdminRole } = require('../utils/jwt_helpers');

router.post('/v1/api/removeimage', verifyAccessToken, verifyAdminRole, removes);

module.exports = router;
