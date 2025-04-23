/**
 * Kullanıcı girişlerini doğrulamak için yardımcı fonksiyon
 * @param {Object} schema - Joi şeması
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  
  if (error) {
    res.status(400);
    throw new Error(`Doğrulama hatası: ${error.details[0].message}`);
  }
  
  next();
};

module.exports = validate; 