const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Mesaj içeriği zorunludur'],
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video', 'location'],
      default: 'text',
    },
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
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.methods.markAsDeletedFor = async function (userId) {
  if (!this.deletedFor.includes(userId)) {
    this.deletedFor.push(userId);
    await this.save();
  }
  return this;
};

messageSchema.pre('find', function () {
  const query = this.getQuery();
  const userId = query.userId;

  if (userId) {
    this.where({ deletedFor: { $ne: userId } });
    delete query.userId;
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 