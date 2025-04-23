const User = require('../models/user');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Kullanıcı kayıt işlemi
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Kullanıcının zaten var olup olmadığını kontrol et
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Bu email adresi ile kayıtlı bir kullanıcı zaten var');
  }

  // Yeni kullanıcı oluştur
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Geçersiz kullanıcı bilgileri');
  }
};

/**
 * @desc    Kullanıcı girişi
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Kullanıcıyı email ile bul
  const user = await User.findOne({ email });

  // Kullanıcı varsa ve şifre doğruysa
  if (user && (await user.matchPassword(password))) {
    // Kullanıcıyı çevrimiçi olarak işaretle
    user.isOnline = true;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Geçersiz email veya şifre');
  }
};

/**
 * @desc    Kullanıcı çıkışı
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
  try {
    // Kullanıcıyı ID ile bul ve çevrimdışı olarak işaretle
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.isOnline = false;
      await user.save();
    }
    
    res.status(200).json({ message: 'Başarıyla çıkış yapıldı' });
  } catch (error) {
    res.status(500);
    throw new Error('Sunucu hatası');
  }
};

/**
 * @desc    Geçerli JWT token kontrolü
 * @route   GET /api/auth/verify
 * @access  Private
 */
const verifyToken = async (req, res) => {
  try {
    // req.user, authMiddleware tarafından eklenir
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      res.status(404);
      throw new Error('Kullanıcı bulunamadı');
    }
    
    res.status(200).json({ 
      isValid: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline
      } 
    });
  } catch (error) {
    res.status(401);
    throw new Error('Token geçersiz');
  }
};

module.exports = { registerUser, loginUser, logoutUser, verifyToken };
