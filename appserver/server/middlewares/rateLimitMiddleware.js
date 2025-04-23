const rateLimit = require('express-rate-limit');

// API istekleri için genel hız sınırlayıcı
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her IP'den 15 dakikada en fazla 100 istek
  message: {
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true, // X-RateLimit-* header'larını ekle
  legacyHeaders: false, // X-RateLimit-* header'larını eski formatta ekleme
});

// Kimlik doğrulama istekleri için daha sıkı hız sınırlayıcı
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10, // Her IP'den 15 dakikada en fazla 10 istek
  message: {
    message: 'Çok fazla giriş denemesi yaptınız, lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mesajlaşma için daha yüksek limitli hız sınırlayıcı
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 50, // Her IP'den 1 dakikada en fazla 50 istek
  message: {
    message: 'Çok fazla mesaj gönderdiniz, lütfen kısa bir süre bekleyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  messageLimiter,
}; 