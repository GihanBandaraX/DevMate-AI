const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');

// Initialize Gemini API using API key from .env (Supports both old AIza and new AQ. keys)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const handleChat = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "userId and message are required" });
    }

    // UPDATED: Replaced deprecated gemini-1.5-flash with the active gemini-3.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Generate response from AI
    const result = await model.generateContent(message);
    const responseText = result.response.text();

    // Find or create chat history in database for the user
    let chat = await Chat.findOne({ userId });

    if (!chat) {
      chat = new Chat({
        userId,
        messages: []
      });
    }

    // Save user message and AI response
    chat.messages.push({ sender: 'user', text: message });
    chat.messages.push({ sender: 'ai', text: responseText });

    await chat.save();

    res.status(200).json({
      reply: responseText,
      chatHistory: chat
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { handleChat };
