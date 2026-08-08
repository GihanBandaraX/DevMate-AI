const express = require('express');
const router = express.Router();
const { googleAuth } = require('../controllers/authController');

// Route for Google Authentication
router.post('/google', googleAuth);

module.exports = router;