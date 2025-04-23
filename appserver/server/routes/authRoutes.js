const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, verifyToken } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { registerSchema, loginSchema } = require('../utils/validationSchemas');

// /api/auth/register
router.post('/register', validate(registerSchema), registerUser);

// /api/auth/login
router.post('/login', validate(loginSchema), loginUser);

// /api/auth/logout - korumalı rota
router.post('/logout', protect, logoutUser);

// /api/auth/verify - token doğrulama
router.get('/verify', protect, verifyToken);

module.exports = router;
