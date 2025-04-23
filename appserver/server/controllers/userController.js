const User = require('../models/user');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Kullanıcı kayıt işlemi
 * @route   POST /api/users
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
 * @route   POST /api/users/login
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
 * @route   POST /api/users/logout
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
 * @desc    Tüm kullanıcıları getir
 * @route   GET /api/users
 * @access  Private
 */
const getUsers = async (req, res) => {
  try {
    // Şu anki kullanıcıyı hariç tut ve şifre alanını dışla
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500);
    throw new Error('Kullanıcılar alınamadı: ' + error.message);
  }
};

/**
 * @desc    Kullanıcı profil bilgilerini getir
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      res.status(404);
      throw new Error('Kullanıcı bulunamadı');
    }
    
    res.json(user);
  } catch (error) {
    res.status(500);
    throw new Error('Profil bilgileri alınamadı: ' + error.message);
  }
};

/**
 * @desc    Kullanıcı profilini güncelle
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      res.status(404);
      throw new Error('Kullanıcı bulunamadı');
    }
    
    // İsteğin body kısmından gelen değerleri kullan veya mevcut değerleri koru
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;
    
    // Eğer şifre gönderilmişse, güncelle (hashleme otomatik yapılacak)
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      isOnline: updatedUser.isOnline,
    });
  } catch (error) {
    res.status(500);
    throw new Error('Profil güncellenemedi: ' + error.message);
  }
};

/**
 * @desc    Belirli bir kullanıcının bilgilerini getir
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      res.status(404);
      throw new Error('Kullanıcı bulunamadı');
    }
    
    res.json(user);
  } catch (error) {
    res.status(500);
    throw new Error('Kullanıcı bilgileri alınamadı: ' + error.message);
  }
};

module.exports = { registerUser, loginUser, logoutUser, getUsers, getUserProfile, updateUserProfile, getUserById }; 