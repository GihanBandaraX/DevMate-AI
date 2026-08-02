const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // User Google ID
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  
  // User full name
  name: {
    type: String,
    required: true
  },
  
  // User email address
  email: {
    type: String,
    required: true,
    unique: true
  },
  
  // User profile picture URL
  profilePic: {
    type: String
  }
}, {
  timestamps: true // Automatically track creation and update times
});

module.exports = mongoose.model('User', userSchema);