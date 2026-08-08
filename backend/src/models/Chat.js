const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [
    {
      sender: {
        type: String,
        enum: ['user', 'ai'],
        required: true
      },
      text: {
        type: String,
        required: true
      },
      fileName: {
        type: String
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);