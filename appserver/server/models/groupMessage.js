const mongoose = require('mongoose');

const groupMessageSchema = mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Mesaj içeriği zorunludur'],
      trim: true,
    },
    // Mesajı görüntüleyen kullanıcılar
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Mesaj tipi (metin, resim, dosya vb.)
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video', 'location'],
      default: 'text',
    },
    // Medya bilgileri
    mediaUrl: {
      type: String,
      default: null,
    },
    mediaType: {
      type: String,
      default: null,
    },
    mediaSize: {
      type: Number,
      default: null,
    },
    mediaName: {
      type: String,
      default: null,
    },
    // Mesajın silindiği tarih
    deletedAt: {
      type: Date,
      default: null,
    },
    // Mesajın kimler tarafından silindiği
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Eğer bu bir yanıt mesajı ise, yanıtlanan mesajın referansı
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupMessage',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Mesajı okundu olarak işaretle
groupMessageSchema.methods.markAsReadBy = async function (userId) {
  // Eğer bu kullanıcı tarafından daha önce okunmamışsa
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    await this.save();
  }
  return this;
};

// Mesajı silinen olarak işaretle (yumuşak silme)
groupMessageSchema.methods.markAsDeletedFor = async function (userId) {
  // Eğer bu mesaj bu kullanıcı tarafından daha önce silinmemişse
  if (!this.deletedFor.includes(userId)) {
    this.deletedFor.push(userId);
    await this.save();
  }
  return this;
};

// Mesajları sorgularken silinen mesajları filtrelemek için sorgu middleware'i
groupMessageSchema.pre('find', function () {
  // this.getQuery(), mevcut sorguyu döndürür
  const query = this.getQuery();
  const userId = query.userId;

  // Eğer bir userId belirtilmişse ve silinen mesajları filtrelemek istiyorsak
  if (userId) {
    this.where({ deletedFor: { $ne: userId } });
    delete query.userId; // Bu özel alanı kaldırıyoruz çünkü MongoDB'de yok
  }
});

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);

module.exports = GroupMessage; 