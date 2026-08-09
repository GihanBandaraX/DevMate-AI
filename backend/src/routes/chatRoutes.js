//backend/src/routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getUserChats, 
  createChat, 
  handleChat, 
  deleteChat, 
  renameChat,
  togglePinChat 
} = require('../controllers/chatController');

router.get('/chats/:userId', getUserChats);
router.post('/chat/new', createChat);
router.post('/chat', handleChat);
router.delete('/chat/:chatId', deleteChat);
router.put('/chat/:chatId', renameChat);
router.patch('/chat/:chatId/pin', togglePinChat); // pinning/unpinning a chat


module.exports = router;