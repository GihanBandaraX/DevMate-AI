const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define your model routing tree
const PRIMARY_MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error("Get User Chats Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const createChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const newChat = new Chat({
      userId,
      title: 'New Chat',
      messages: []
    });
    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    console.error("Create Chat Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const handleChat = async (req, res) => {
  try {
    const { userId, chatId, message, fileData, action } = req.body;

    if (!message && !fileData) {
      return res.status(400).json({ error: "Message or file is required" });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
    }

    if (!chat) {
      chat = new Chat({
        userId: userId || 'guest',
        title: message ? message.substring(0, 30) + '...' : (fileData ? `File: ${fileData.name}` : 'New Chat'),
        messages: []
      });
    }

    let userMessageText = message || "";
    let promptForAI = "";
    let displayFileName = null;
    let actionInstruction = "";
    
    if (action === 'add-comments') {
      actionInstruction = `You are an expert developer. Add clear, professional comments to the following code. Return the commented code inside a markdown code block so the user can easily copy or download it.`;
    } 
    else if (action === 'debug') {
      actionInstruction = `You are an expert debugger. Fix any bugs or issues in this code. In your chat response, clearly explain what was fixed and what changes were made, and provide the fully debugged and commented code inside a markdown block.`;
    } 
    else if (action === 'explain') {
      actionInstruction = `You are a code instructor. Explain the code segments, logic, and structure clearly and comprehensively in the chat response.`;
    } 
    else if (action === 'optimize') {
      actionInstruction = `You are a performance optimization expert. Optimize this code by removing redundant or unwanted lines, improving efficiency, and cleaning up the structure. Explain the optimizations in the chat response and provide the optimized code.`;
    }
    else if (action === 'unit-test') {
      actionInstruction = `You are an expert QA engineer. Generate comprehensive unit tests (using Jest, Mocha, PyTest, JUnit, etc.). Return the test code inside a markdown block so the user can easily copy or download it.`;
    }
    else if (action === 'security-scan') {
      actionInstruction = `You are a cybersecurity expert. Scan this code for security vulnerabilities (e.g., SQL Injection, XSS, Insecure Deserialization, Hardcoded API keys). List out security warnings and recommendations clearly in the chat response.`;
    }
    else if (action === 'api-docs') {
      actionInstruction = `You are an API documentation expert. Analyze the endpoints or functions in this code and generate professional documentation or Swagger/OpenAPI format inside a markdown block.`;
    }

    if (fileData) {
      displayFileName = fileData.name;
      const fileExtension = fileData.name.split('.').pop();
      const baseInstruction = actionInstruction || "Please analyze this file.";
      promptForAI = `${baseInstruction}\n\nFile Name: ${fileData.name}\n\`\`\`${fileExtension}\n${fileData.data}\n\`\`\``;
      if (!userMessageText) {
        userMessageText = `Action: ${action || 'analyze'} on file: ${fileData.name}`;
      }
    } else {
      promptForAI = actionInstruction ? `${actionInstruction}\n\n${message}` : message;
    }

    let responseText = "";
    let modelUsed = PRIMARY_MODEL;

    // --- AUTOMATED MODEL ROUTER LOGIC ---
    try {
      console.log(`[Router] Running primary model request: ${PRIMARY_MODEL}`);
      const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
      const result = await model.generateContent(promptForAI);
      responseText = result.response.text();
    } catch (primaryError) {
      // Check if primary error is due to hitting limits (429) or explicit quota strings
      const isQuotaExceeded = primaryError.status === 429 || 
                              (primaryError.message && primaryError.message.toLowerCase().includes("quota"));

      if (isQuotaExceeded) {
        console.warn(`[Router] ${PRIMARY_MODEL} limit reached. Switching seamlessly to ${FALLBACK_MODEL}...`);
        modelUsed = FALLBACK_MODEL;
        
        // Execute the request using the fallback model
        const fallbackModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        const fallbackResult = await fallbackModel.generateContent(promptForAI);
        responseText = fallbackResult.response.text();
      } else {
        // Throw any other unexpected engine errors up to the main catch block
        throw primaryError;
      }
    }
    // --- END ROUTER LOGIC ---

    chat.messages.push({ 
      sender: 'user', 
      text: userMessageText,
      fileName: displayFileName 
    });
    chat.messages.push({ sender: 'ai', text: responseText });

    if (chat.messages.length === 2 && chat.title === 'New Chat') {
      chat.title = message ? message.substring(0, 30) + '...' : `File: ${displayFileName}`;
    }

    await chat.save();

    res.status(200).json({
      reply: responseText,
      modelUsed: modelUsed, // Appended to help frontend verify engine swaps
      chat: chat
    });
  } catch (error) {
    console.error("Detailed Chat Routing Failure:", error);
    res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
  }
};

const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    await Chat.findByIdAndDelete(chatId);
    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Delete Chat Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const renameChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { title },
      { new: true }
    );
    res.status(200).json(updatedChat);
  } catch (error) {
    console.error("Rename Chat Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getUserChats, 
  createChat, 
  handleChat, 
  deleteChat, 
  renameChat 
};
