const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatController');

// POST route for sending message to AI
router.post('/chat', handleChat);

module.exports = router;