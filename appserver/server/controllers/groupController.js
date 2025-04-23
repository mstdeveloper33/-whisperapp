const Group = require('../models/group');
const User = require('../models/user');
const GroupMessage = require('../models/groupMessage');

/**
 * @desc    Yeni grup oluştur
 * @route   POST /api/groups
 * @access  Private
 */
const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Grup adı zorunludur');
    }

    // Yeni grup oluştur
    const newGroup = new Group({
      name,
      description,
      creator: req.user._id,
    });

    // Grubu kaydet
    const savedGroup = await newGroup.save();

    // Üyeleri ekle (eğer varsa)
    if (members && members.length > 0) {
      for (const memberId of members) {
        // Kullanıcının varlığını kontrol et
        const userExists = await User.findById(memberId);
        if (userExists) {
          await savedGroup.addMember(memberId);
        }
      }
    }

    // Güncel grup bilgilerini al (üyelerle birlikte)
    const populatedGroup = await Group.findById(savedGroup._id)
      .populate('creator', 'name email avatar isOnline')
      .populate('members.user', 'name email avatar isOnline');

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500);
    throw new Error('Grup oluşturulamadı: ' + error.message);
  }
};

/**
 * @desc    Grupları listele
 * @route   GET /api/groups
 * @access  Private
 */
const getGroups = async (req, res) => {
  try {
    // Kullanıcının üye olduğu grupları bul
    const groups = await Group.find({
      'members.user': req.user._id,
      isActive: true,
    })
      .populate('creator', 'name email avatar isOnline')
      .populate('members.user', 'name email avatar isOnline')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500);
    throw new Error('Gruplar alınamadı: ' + error.message);
  }
};

/**
 * @desc    Grup detaylarını getir
 * @route   GET /api/groups/:id
 * @access  Private
 */
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name email avatar isOnline')
      .populate('members.user', 'name email avatar isOnline')
      .populate('lastMessage');

    if (!group) {
      res.status(404);
      throw new Error('Grup bulunamadı');
    }

    // Kullanıcının bu gruba erişim izni var mı kontrol et
    const isMember = group.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      res.status(403);
      throw new Error('Bu gruba erişim izniniz yok');
    }

    res.json(group);
  } catch (error) {
    res.status(500);
    throw new Error('Grup bilgileri alınamadı: ' + error.message);
  }
};

/**
 * @desc    Grubu güncelle
 * @route   PUT /api/groups/:id
 * @access  Private
 */
const updateGroup = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Grup bulunamadı');
    }

    // Kullanıcının yönetici (admin) olup olmadığını kontrol et
    const isAdmin = group.members.some(
      (member) =>
        member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );

    if (!isAdmin) {
      res.status(403);
      throw new Error('Grupları sadece yöneticiler güncelleyebilir');
    }

    // Grup bilgilerini güncelle
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (avatar) group.avatar = avatar;

    const updatedGroup = await group.save();

    // Güncellenmiş grup bilgilerini döndür
    const populatedGroup = await Group.findById(updatedGroup._id)
      .populate('creator', 'name email avatar isOnline')
      .populate('members.user', 'name email avatar isOnline');

    res.json(populatedGroup);
  } catch (error) {
    res.status(500);
    throw new Error('Grup güncellenemedi: ' + error.message);
  }
};

/**
 * @desc    Gruba üye ekle
 * @route   POST /api/groups/:id/members
 * @access  Private
 */
const addGroupMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Grup bulunamadı');
    }

    // Kullanıcının yönetici (admin) olup olmadığını kontrol et
    const isAdmin = group.members.some(
      (member) =>
        member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );

    if (!isAdmin) {
      res.status(403);
      throw new Error('Gruba üye eklemek için yönetici olmalısınız');
    }

    // Eklenecek kullanıcının var olup olmadığını kontrol et
    const userExists = await User.findById(userId);
    if (!userExists) {
      res.status(404);
      throw new Error('Eklenecek kullanıcı bulunamadı');
    }

    // Kullanıcıyı gruba ekle
    await group.addMember(userId, role || 'member');

    // Güncellenmiş grup bilgilerini döndür
    const updatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email avatar isOnline')
      .populate('members.user', 'name email avatar isOnline');

    res.json(updatedGroup);
  } catch (error) {
    res.status(500);
    throw new Error('Üye eklenemedi: ' + error.message);
  }
};

/**
 * @desc    Gruptan üye çıkar
 * @route   DELETE /api/groups/:id/members/:userId
 * @access  Private
 */
const removeGroupMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Grup bulunamadı');
    }

    // İşlem yapılacak kullanıcı mevcut mu?
    const userExists = await User.findById(userId);
    if (!userExists) {
      res.status(404);
      throw new Error('Çıkarılacak kullanıcı bulunamadı');
    }

    // Kullanıcı kendisini çıkarıyor mu?
    const isSelfRemoval = userId === req.user._id.toString();

    // Değilse, admin kontrolü yap
    if (!isSelfRemoval) {
      const isAdmin = group.members.some(
        (member) =>
          member.user.toString() === req.user._id.toString() && member.role === 'admin'
      );

      if (!isAdmin) {
        res.status(403);
        throw new Error('Üyeleri çıkarmak için yönetici olmalısınız');
      }
    }

    // Üyeyi gruptan çıkar
    await group.removeMember(userId);

    // Grup oluşturucusu çıkarıldıysa ve başka admin yoksa, başka bir üyeyi admin yap
    if (userId === group.creator.toString()) {
      const hasAnotherAdmin = group.members.some(
        (member) => member.role === 'admin'
      );

      if (!hasAnotherAdmin && group.members.length > 0) {
        // İlk üyeyi admin yap
        const firstMember = group.members[0];
        await group.updateMemberRole(firstMember.user, 'admin');
      }
    }

    // Güncellenmiş grup bilgilerini döndür
    const updatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email avatar isOnline')
      .populate('members.user', 'name email avatar isOnline');

    res.json(updatedGroup);
  } catch (error) {
    res.status(500);
    throw new Error('Üye çıkarılamadı: ' + error.message);
  }
};

/**
 * @desc    Grubu sil (devre dışı bırak)
 * @route   DELETE /api/groups/:id
 * @access  Private
 */
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Grup bulunamadı');
    }

    // Kullanıcının oluşturucu veya admin olup olmadığını kontrol et
    const isCreatorOrAdmin = 
      group.creator.toString() === req.user._id.toString() ||
      group.members.some(
        (member) =>
          member.user.toString() === req.user._id.toString() && member.role === 'admin'
      );

    if (!isCreatorOrAdmin) {
      res.status(403);
      throw new Error('Grubu silmek için oluşturucu veya yönetici olmalısınız');
    }

    // Grubu devre dışı bırak (yumuşak silme)
    group.isActive = false;
    await group.save();

    res.json({ message: 'Grup başarıyla silindi' });
  } catch (error) {
    res.status(500);
    throw new Error('Grup silinemedi: ' + error.message);
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
}; 