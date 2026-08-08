//backend/src/routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getUserChats, 
  createChat, 
  handleChat, 
  deleteChat, 
  renameChat 
} = require('../controllers/chatController');

router.get('/chats/:userId', getUserChats);
router.post('/chat/new', createChat);
router.post('/chat', handleChat);
router.delete('/chat/:chatId', deleteChat);
router.put('/chat/:chatId', renameChat);

module.exports = router;