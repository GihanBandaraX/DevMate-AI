//backend/src/controllers/authController.js

const User = require('../models/User');

// Handle Google Login / Signup
const googleAuth = async (req, res) => {
  try {
    const { googleId, name, email, profilePic } = req.body;

    // Check if user already exists in database
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, return success and user data
      return res.status(200).json({ 
        message: "Login successful", 
        user 
      });
    }

    // If user does not exist, create a new user
    user = new User({
      googleId,
      name,
      email,
      profilePic
    });

    await user.save();
    
    // Return success and new user data
    res.status(201).json({ 
      message: "User registered successfully", 
      user 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { googleAuth };