const express = require('express');
const router = express.Router();
const { sendMessage, getMessagesByUser, getUserChats } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { sendMessageSchema } = require('../utils/validationSchemas');

// Tüm mesaj rotaları için koruma middleware'i kullan
router.use(protect);

// /api/messages
router.route('/').post(validate(sendMessageSchema), sendMessage);

// /api/messages/chats
router.get('/chats', getUserChats);

// /api/messages/:userId
router.get('/:userId', getMessagesByUser);

module.exports = router; 