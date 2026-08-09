const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define primary and fallback models
const PRIMARY_MODEL = "gemini-3.6-flash";
const SECONDARY_FALLBACK = "gemini-3.5-flash";
const COST_OR_SPEED_FALLBACK = "gemini-3.5-flash-lite";

const MODEL_CHAIN = [PRIMARY_MODEL, SECONDARY_FALLBACK, COST_OR_SPEED_FALLBACK];

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
      messages: [],
      isPinned: false
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
    const { userId, chatId, message, fileData, action, modelPreference } = req.body;

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
        messages: [],
        isPinned: false
      });
    }

    let userMessageText = message || "";
    let displayFileName = null;
    let actionInstruction = "";
    
    if (action === 'add-comments') {
      actionInstruction = `You are an expert developer. Add clear, professional comments to the following code. Return the commented code inside a markdown code block.`;
    } 
    else if (action === 'debug') {
      actionInstruction = `You are an expert debugger. Fix any bugs or issues in this code. Provide the fully debugged and commented code inside a markdown block.`;
    } 
    else if (action === 'explain') {
      actionInstruction = `You are a code instructor. Explain the code segments, logic, and structure step-by-step clearly.`;
    } 
    else if (action === 'optimize') {
      actionInstruction = `You are a performance optimization expert. Optimize this code and provide the optimized code inside a markdown block.`;
    }
    else if (action === 'unit-test') {
      actionInstruction = `You are an expert QA engineer. Generate comprehensive unit tests for this code inside a markdown block.`;
    }
    else if (action === 'security-scan') {
      actionInstruction = `You are a cybersecurity expert. Scan this code for security vulnerabilities and list warnings.`;
    }
    else if (action === 'api-docs') {
      actionInstruction = `You are an API documentation expert. Generate professional documentation inside a markdown block.`;
    }

    let contentsForAI = [];
    let baseInstruction = actionInstruction || "Please analyze this input.";

    if (fileData) {
      displayFileName = fileData.name;
      const isImage = fileData.type && fileData.type.startsWith('image/');
      const fileLabel = isImage ? `🖼️ Image: ${fileData.name}` : `📁 File: ${fileData.name}`;
      userMessageText = message ? `${fileLabel}\n\n${message}` : fileLabel;

      if (isImage) {
        const base64Data = fileData.data.includes(',') ? fileData.data.split(',')[1] : fileData.data;
        contentsForAI = [
          `${baseInstruction}\n\nUser Prompt/Question: ${message || "Please read and extract code from this screenshot."}`,
          {
            inlineData: {
              data: base64Data,
              mimeType: fileData.type || "image/png"
            }
          }
        ];
      } else {
        const fileExtension = fileData.name.split('.').pop();
        const fileContentPrompt = `${baseInstruction}\n\nFile Name: ${fileData.name}\n\`\`\`${fileExtension}\n${fileData.data}\n\`\`\``;
        contentsForAI = [fileContentPrompt];
      }
    } else {
      const textPrompt = actionInstruction ? `${actionInstruction}\n\n${message}` : message;
      contentsForAI = [textPrompt];
    }

    let responseText = "";
    let modelUsed = PRIMARY_MODEL;

    // Dynamic Model Chain based on User Preference
    let activeModelChain = [...MODEL_CHAIN];
    if (modelPreference && activeModelChain.includes(modelPreference)) {
      activeModelChain = [modelPreference, ...activeModelChain.filter(m => m !== modelPreference)];
    }

    // Send request through intelligent Fallback Chain (handling 429 / Quota errors)
    for (let i = 0; i < activeModelChain.length; i++) {
      const currentModel = activeModelChain[i];
      try {
        const model = genAI.getGenerativeModel({ model: currentModel });
        const result = await model.generateContent(contentsForAI);
        responseText = result.response.text();
        modelUsed = currentModel;
        break; // Exit loop if successful
      } catch (error) {
        const isRateLimitOrQuota = error.status === 429 || 
                                   error.status === 503 ||
                                   (error.message && (
                                     error.message.toLowerCase().includes("quota") || 
                                     error.message.toLowerCase().includes("429") || 
                                     error.message.toLowerCase().includes("overloaded")
                                   ));

        if (isRateLimitOrQuota && i < activeModelChain.length - 1) {
          console.warn(`[Model Fallback] ${currentModel} failed (429/Quota). Switching to next model: ${activeModelChain[i + 1]}`);
          continue;
        } else if (i === activeModelChain.length - 1) {
          throw error; // Throw the final error if all models fail
        } else {
          throw error; // Stop immediately if it's another type of error
        }
      }
    }

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
      modelUsed: modelUsed,
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

const togglePinChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.isPinned = !chat.isPinned;
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    console.error("Toggle Pin Chat Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getUserChats, 
  createChat, 
  handleChat, 
  deleteChat, 
  renameChat,
  togglePinChat 
};