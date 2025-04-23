const jwt = require('jsonwebtoken');

// Kullanıcı ID'sine göre JWT token oluşturur
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // 30 gün geçerli token
  });
};

module.exports = generateToken;
