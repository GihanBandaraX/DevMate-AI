// backend/src/controllers/authController.js

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify the Google ID Token sent from frontend
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    const user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };

    res.status(200).json({
      message: "Authentication successful",
      user: user
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  googleAuth,
};