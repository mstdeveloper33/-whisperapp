const Group = require('../models/group');
const GroupMessage = require('../models/groupMessage');

/**
 * @desc    Grup mesajı gönder
 * @route   POST /api/groups/:groupId/messages
 * @access  Private
 */
const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, messageType, mediaUrl, mediaType, mediaSize, mediaName, replyTo } = req.body;

    // Içerik kontrolü
    if (!content) {
      res.status(400);
      throw new Error('Mesaj içeriği zorunludur');
    }

    // Grup var mı kontrol et
    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404);
      throw new Error('Grup bulunamadı');
    }

    // Kullanıcı grubun üyesi mi kontrol et
    const isMember = group.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      res.status(403);
      throw new Error('Bu gruba mesaj göndermek için üye olmalısınız');
    }

    // Eğer mesaj bir yanıt ise, yanıtlanan mesajın varlığını kontrol et
    if (replyTo) {
      const replyMessage = await GroupMessage.findById(replyTo);
      if (!replyMessage) {
        res.status(404);
        throw new Error('Yanıtlanan mesaj bulunamadı');
      }
    }

    // Yeni grup mesajı oluştur
    const newMessage = new GroupMessage({
      group: groupId,
      sender: req.user._id,
      content,
      messageType: messageType || 'text',
      mediaUrl,
      mediaType,
      mediaSize,
      mediaName,
      replyTo,
      // Gönderen mesajı otomatik olarak okumuş olarak işaretle
      readBy: [req.user._id],
    });

    // Mesajı kaydet
    const savedMessage = await newMessage.save();

    // Grup'un son mesajını güncelle
    group.lastMessage = savedMessage._id;
    await group.save();

    // Mesajı gönderen bilgileriyle birlikte döndür
    const populatedMessage = await GroupMessage.findById(savedMessage._id)
      .populate('sender', 'name email avatar isOnline')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500);
    throw new Error('Mesaj gönderilemedi: ' + error.message);
  }
};

/**
 * @desc    Grup mesajlarını getir
 * @route   GET /api/groups/:groupId/messages
 * @access  Private
 */
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Grup var mı kontrol et
    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404);
      throw new Error('Grup bulunamadı');
    }

    // Kullanıcı grubun üyesi mi kontrol et
    const isMember = group.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      res.status(403);
      throw new Error('Bu grubun mesajlarını görmek için üye olmalısınız');
    }

    // Sayfalama için parametreler
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Mesajları getir (silinmeyen ve bu kullanıcı için silinmemiş olanlar)
    const messages = await GroupMessage.find({
      group: groupId,
      deletedFor: { $ne: req.user._id },
    })
      .sort({ createdAt: -1 }) // En son mesajları önce getir
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email avatar isOnline')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      });

    // Mesajları kronolojik sıraya çevir (en eski ilk)
    const orderedMessages = messages.reverse();

    // Okunmamış mesajları okundu olarak işaretle
    const unreadMessages = orderedMessages.filter(
      (msg) => !msg.readBy.includes(req.user._id)
    );

    for (const message of unreadMessages) {
      await message.markAsReadBy(req.user._id);
    }

    // Toplam mesaj sayısını hesapla (sayfalama için)
    const totalMessages = await GroupMessage.countDocuments({
      group: groupId,
      deletedFor: { $ne: req.user._id },
    });

    res.json({
      messages: orderedMessages,
      page,
      pages: Math.ceil(totalMessages / limit),
      total: totalMessages,
    });
  } catch (error) {
    res.status(500);
    throw new Error('Mesajlar alınamadı: ' + error.message);
  }
};

/**
 * @desc    Grup mesajını sil (yumuşak silme)
 * @route   DELETE /api/groups/:groupId/messages/:messageId
 * @access  Private
 */
const deleteGroupMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    
    // Grup var mı kontrol et
    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404);
      throw new Error('Grup bulunamadı');
    }

    // Mesaj var mı kontrol et
    const message = await GroupMessage.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error('Mesaj bulunamadı');
    }

    // Mesaj bu gruba ait mi kontrol et
    if (message.group.toString() !== groupId) {
      res.status(400);
      throw new Error('Mesaj bu gruba ait değil');
    }

    // Kullanıcı, mesajın sahibi mi veya grup yöneticisi mi kontrol et
    const isMessageSender = message.sender.toString() === req.user._id.toString();
    const isGroupAdmin = group.members.some(
      (member) =>
        member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );

    // Mesajı silme izni var mı?
    if (!isMessageSender && !isGroupAdmin) {
      res.status(403);
      throw new Error('Bu mesajı silme yetkiniz yok');
    }

    // Mesajı bu kullanıcı için silinen olarak işaretle
    await message.markAsDeletedFor(req.user._id);

    res.json({ message: 'Mesaj başarıyla silindi' });
  } catch (error) {
    res.status(500);
    throw new Error('Mesaj silinemedi: ' + error.message);
  }
};

module.exports = {
  sendGroupMessage,
  getGroupMessages,
  deleteGroupMessage,
}; 