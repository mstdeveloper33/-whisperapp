const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { 
  createGroupSchema, 
  updateGroupSchema, 
  addGroupMemberSchema, 
  sendGroupMessageSchema 
} = require('../utils/validationSchemas');
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
} = require('../controllers/groupController');
const {
  sendGroupMessage,
  getGroupMessages,
  deleteGroupMessage,
} = require('../controllers/groupMessageController');

// Tüm grup rotaları için kimlik doğrulama gerekli
router.use(protect);

// Grup yönetimi
router.route('/')
  .post(validate(createGroupSchema), createGroup)  // Yeni grup oluştur
  .get(getGroups);    // Kullanıcının gruplarını getir

router.route('/:id')
  .get(getGroupById)  // Grup detaylarını getir
  .put(validate(updateGroupSchema), updateGroup)   // Grup bilgilerini güncelle
  .delete(deleteGroup); // Grubu sil

// Grup üyeleri yönetimi
router.route('/:id/members')
  .post(validate(addGroupMemberSchema), addGroupMember); // Gruba üye ekle

router.route('/:id/members/:userId')
  .delete(removeGroupMember); // Gruptan üye çıkar

// Grup mesajları
router.route('/:groupId/messages')
  .post(validate(sendGroupMessageSchema), sendGroupMessage)  // Grup mesajı gönder
  .get(getGroupMessages);  // Grup mesajlarını getir

router.route('/:groupId/messages/:messageId')
  .delete(deleteGroupMessage); // Grup mesajını sil

module.exports = router; 