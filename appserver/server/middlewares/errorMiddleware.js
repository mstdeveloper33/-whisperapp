// Bulunamayan rotalar için hata yakalayıcı
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Genel hata yakalayıcı
const errorHandler = (err, req, res, next) => {
  // Status kodu 200 ise (default) 500 olarak değiştir, değilse mevcut kodu kullan
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
