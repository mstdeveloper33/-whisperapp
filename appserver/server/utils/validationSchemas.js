// validationSchemas.js
const Joi = require('joi');

// Kullanıcı kaydı doğrulama şeması
const registerSchema = Joi.object({
  name: Joi.string().required().min(3).max(50).messages({
    'string.empty': 'Ad alanı zorunludur',
    'string.min': 'Ad en az 3 karakter olmalıdır',
    'string.max': 'Ad en fazla 50 karakter olabilir',
  }),
  email: Joi.string().required().email().messages({
    'string.empty': 'Email alanı zorunludur',
    'string.email': 'Geçerli bir email adresi giriniz',
  }),
  password: Joi.string().required().min(6).messages({
    'string.empty': 'Şifre alanı zorunludur',
    'string.min': 'Şifre en az 6 karakter olmalıdır',
  }),
});

// Kullanıcı girişi doğrulama şeması
const loginSchema = Joi.object({
  email: Joi.string().required().email().messages({
    'string.empty': 'Email alanı zorunludur',
    'string.email': 'Geçerli bir email adresi giriniz',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Şifre alanı zorunludur',
  }),
});

// Kullanıcı profili güncelleme doğrulama şeması
const updateProfileSchema = Joi.object({
  name: Joi.string().min(3).max(50).messages({
    'string.min': 'Ad en az 3 karakter olmalıdır',
    'string.max': 'Ad en fazla 50 karakter olabilir',
  }),
  email: Joi.string().email().messages({
    'string.email': 'Geçerli bir email adresi giriniz',
  }),
  password: Joi.string().min(6).messages({
    'string.min': 'Şifre en az 6 karakter olmalıdır',
  }),
  avatar: Joi.string().uri().messages({
    'string.uri': 'Avatar alanı geçerli bir URL olmalıdır',
  }),
});

// Mesaj gönderme doğrulama şeması
const sendMessageSchema = Joi.object({
  receiverId: Joi.string().required().messages({
    'string.empty': 'Alıcı ID zorunludur',
  }),
  content: Joi.string().required().messages({
    'string.empty': 'Mesaj içeriği zorunludur',
  }),
  messageType: Joi.string().valid('text', 'image', 'file', 'audio', 'video', 'location'),
  mediaUrl: Joi.string().uri().allow(null, ''),
  mediaType: Joi.string().allow(null, ''),
  mediaSize: Joi.number().allow(null),
  mediaName: Joi.string().allow(null, ''),
});

// Grup oluşturma doğrulama şeması
const createGroupSchema = Joi.object({
  name: Joi.string().required().min(3).max(50).messages({
    'string.empty': 'Grup adı zorunludur',
    'string.min': 'Grup adı en az 3 karakter olmalıdır',
    'string.max': 'Grup adı en fazla 50 karakter olabilir',
  }),
  description: Joi.string().allow(''),
  members: Joi.array().items(Joi.string()),
});

// Grup güncelleme doğrulama şeması
const updateGroupSchema = Joi.object({
  name: Joi.string().min(3).max(50).messages({
    'string.min': 'Grup adı en az 3 karakter olmalıdır',
    'string.max': 'Grup adı en fazla 50 karakter olabilir',
  }),
  description: Joi.string().allow(''),
  avatar: Joi.string().uri().messages({
    'string.uri': 'Avatar alanı geçerli bir URL olmalıdır',
  }),
});

// Grup üyesi ekleme doğrulama şeması
const addGroupMemberSchema = Joi.object({
  userId: Joi.string().required().messages({
    'string.empty': 'Kullanıcı ID zorunludur',
  }),
  role: Joi.string().valid('admin', 'member'),
});

// Grup mesajı gönderme doğrulama şeması
const sendGroupMessageSchema = Joi.object({
  content: Joi.string().required().messages({
    'string.empty': 'Mesaj içeriği zorunludur',
  }),
  messageType: Joi.string().valid('text', 'image', 'file', 'audio', 'video', 'location'),
  mediaUrl: Joi.string().uri().allow(null, ''),
  mediaType: Joi.string().allow(null, ''),
  mediaSize: Joi.number().allow(null),
  mediaName: Joi.string().allow(null, ''),
  replyTo: Joi.string().allow(null, ''),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  sendMessageSchema,
  createGroupSchema,
  updateGroupSchema,
  addGroupMemberSchema,
  sendGroupMessageSchema,
}; 