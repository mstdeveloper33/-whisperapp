const mongoose = require('mongoose');

const groupSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Grup adı zorunludur'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    avatar: {
      type: String,
      default: 'https://icon-library.com/images/group-icon/group-icon-25.jpg',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Grup oluşturulduğunda, oluşturucu otomatik olarak admin rolüyle eklenir
groupSchema.pre('save', function (next) {
  // Bu yeni bir grup mu kontrol et
  if (this.isNew) {
    const existingMember = this.members.find(
      (member) => member.user.toString() === this.creator.toString()
    );

    // Oluşturucu henüz üye olarak eklenmemişse, ekle
    if (!existingMember) {
      this.members.push({
        user: this.creator,
        role: 'admin',
        joinedAt: Date.now(),
      });
    }
  }
  next();
});

// Grup üyesi ekle
groupSchema.methods.addMember = async function (userId, role = 'member') {
  // Kullanıcı zaten üye mi kontrol et
  const existingMember = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  // Eğer üye değilse, ekle
  if (!existingMember) {
    this.members.push({
      user: userId,
      role,
      joinedAt: Date.now(),
    });
    await this.save();
  }
  return this;
};

// Grup üyesini çıkar
groupSchema.methods.removeMember = async function (userId) {
  // Zaten üye mi kontrol et
  const memberIndex = this.members.findIndex(
    (member) => member.user.toString() === userId.toString()
  );

  // Üye bulunduysa, çıkar
  if (memberIndex !== -1) {
    this.members.splice(memberIndex, 1);
    await this.save();
  }
  return this;
};

// Üye rolünü güncelle
groupSchema.methods.updateMemberRole = async function (userId, newRole) {
  // Zaten üye mi kontrol et
  const member = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  // Üye bulunduysa, rolünü güncelle
  if (member) {
    member.role = newRole;
    await this.save();
  }
  return this;
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group; 