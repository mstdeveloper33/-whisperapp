const Message = require('../models/message');
const User = require('../models/user');

/**
 * @desc    Mesaj gönder
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    res.status(400);
    throw new Error('Alıcı ID ve mesaj içeriği gereklidir');
  }

  try {
    // Alıcının var olup olmadığını kontrol et
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404);
      throw new Error('Alıcı bulunamadı');
    }

    // Yeni mesaj oluştur
    const newMessage = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
    });

    // Mesajı kaydet
    await newMessage.save();

    // Mesajı gönderen ve alıcı bilgileriyle birlikte döndür
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name avatar isOnline')
      .populate('receiver', 'name avatar isOnline');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500);
    throw new Error('Mesaj gönderilemedi: ' + error.message);
  }
};

/**
 * @desc    Belirli bir kullanıcı ile olan mesajları getir
 * @route   GET /api/messages/:userId
 * @access  Private
 */
const getMessagesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcının var olup olmadığını kontrol et
    const userExists = await User.findById(userId);
    if (!userExists) {
      res.status(404);
      throw new Error('Kullanıcı bulunamadı');
    }

    // İki kullanıcı arasındaki mesajları getir ve zaman damgasına göre sırala
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar isOnline')
      .populate('receiver', 'name avatar isOnline');

    // Diğer kullanıcıdan gelen okunmamış mesajları okundu olarak işaretle
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500);
    throw new Error('Mesajlar alınamadı: ' + error.message);
  }
};

/**
 * @desc    Kullanıcının tüm sohbetlerini getir
 * @route   GET /api/messages/chats
 * @access  Private
 */
const getUserChats = async (req, res) => {
  try {
    // Kullanıcının gönderdiği veya aldığı tüm mesajları bul
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    }).sort({ createdAt: -1 });

    // Sohbet edilen kullanıcıların benzersiz ID'lerini al
    const chatUserIds = [...new Set(
      messages.map(msg => 
        msg.sender.toString() === req.user._id.toString() 
          ? msg.receiver.toString() 
          : msg.sender.toString()
      )
    )];

    // Her bir kullanıcı için son mesajı ve okunmamış mesaj sayısını hesapla
    const chats = await Promise.all(
      chatUserIds.map(async (userId) => {
        // Kullanıcı bilgilerini getir
        const user = await User.findById(userId).select('name avatar isOnline');
        
        // Son mesajı bul
        const lastMessage = await Message.findOne({
          $or: [
            { sender: req.user._id, receiver: userId },
            { sender: userId, receiver: req.user._id },
          ],
        }).sort({ createdAt: -1 });
        
        // Okunmamış mesaj sayısını hesapla
        const unreadCount = await Message.countDocuments({
          sender: userId,
          receiver: req.user._id,
          read: false,
        });

        return {
          user,
          lastMessage,
          unreadCount,
        };
      })
    );

    res.json(chats);
  } catch (error) {
    res.status(500);
    throw new Error('Sohbetler alınamadı: ' + error.message);
  }
};

module.exports = { sendMessage, getMessagesByUser, getUserChats }; 