const express = require('express');
const router = express.Router();
const { getUsers, getUserProfile, updateUserProfile, getUserById } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { updateProfileSchema } = require('../utils/validationSchemas');

// Tüm rotalar için kimlik doğrulama gerekli
router.use(protect);

// /api/users
router.route('/').get(getUsers);

// /api/users/profile
router.route('/profile')
  .get(getUserProfile)
  .put(validate(updateProfileSchema), updateUserProfile);

// /api/users/:id
router.route('/:id').get(getUserById);

module.exports = router; 