const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Kullanıcı kimlik doğrulama middleware'i
const protect = async (req, res, next) => {
  let token;

  // Token, header'da "Bearer {token}" formatında gelmeli
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token'ı Bearer kısmından ayır
      token = req.headers.authorization.split(' ')[1];

      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kullanıcıyı token'dan alınan id ile bul ve şifre hariç tüm bilgileri getir
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Yetkilendirme başarısız, geçersiz token');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Yetkilendirme başarısız, token bulunamadı');
  }
};

module.exports = { protect };
