const express = require('express');
const router = express.Router();

router.get('/v1/api', (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'api ok',
	});
});

module.exports = router;
