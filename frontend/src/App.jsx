import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Components
import Sidebar from './components/Sidebar'; 
import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import ChatMessageList from './components/ChatMessageList';
import CodeDiffView from './components/CodeDiffView';


function App() {
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Analyzing...');
  const [currentAction, setCurrentAction] = useState(null);
  
  const [activeModel, setActiveModel] = useState('gemini-3.6-flash');

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [darkMode, setDarkMode] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Sidebar States
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuChatId, setOpenMenuChatId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fileInputRef = useRef(null);

  const userId = user ? user.email : "guest_user_12345";

  const [showDiffModal, setShowDiffModal] = useState(false);
  const [originalCode, setOriginalCode] = useState('');
  const [modifiedCode, setModifiedCode] = useState('');

  const handleOpenDiff = (oldCode, newCode) => {
    setOriginalCode(oldCode);
    setModifiedCode(newCode);
    setShowDiffModal(true);
  };  

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/chats/${userId}`);
        const initializedChats = response.data.map(c => ({ 
          ...c, 
          pinned: c.isPinned !== undefined ? c.isPinned : (c.pinned || false) 
        }));
        setChats(initializedChats);
        if (initializedChats.length > 0 && !activeChatId) {
          setActiveChatId(initializedChats[0]._id);
          setChatHistory(initializedChats[0].messages);
        }
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      }
    };
    fetchChats();
  }, [userId]);

  useEffect(() => {
    if (activeChatId) {
      const currentChat = chats.find(c => c._id === activeChatId);
      if (currentChat) {
        setChatHistory(currentChat.messages || []);
      }
    } else {
      setChatHistory([]);
    }
  }, [activeChatId, chats]);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/google', {
        token: credentialResponse.credential,
      });

      if (response.status === 200) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Login verification failed:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setChats([]); 
    setChatHistory([]);
    setActiveChatId(null);
    localStorage.removeItem('user');
  };

  const handleNewChat = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/chat/new', { userId });
      const newChat = { ...response.data, pinned: false };
      setChats([newChat, ...chats]);
      setActiveChatId(newChat._id);
      setChatHistory([]);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    setOpenMenuChatId(null);
    try {
      await axios.delete(`http://localhost:5000/api/chat/${chatId}`);
      const updatedChats = chats.filter(c => c._id !== chatId);
      setChats(updatedChats);
      if (activeChatId === chatId) {
        if (updatedChats.length > 0) {
          setActiveChatId(updatedChats[0]._id);
          setChatHistory(updatedChats[0].messages);
        } else {
          setActiveChatId(null);
          setChatHistory([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleRenameChat = async (chatId) => {
    if (!newTitle.trim()) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/chat/${chatId}`, { title: newTitle });
      setChats(chats.map(c => c._id === chatId ? { ...c, title: response.data.title } : c));
      setEditingChatId(null);
      setNewTitle('');
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  const handlePinChat = async (e, chatId) => {
    e.stopPropagation();
    setOpenMenuChatId(null);
    try {
      const response = await axios.patch(`http://localhost:5000/api/chat/${chatId}/pin`);
      const updatedChat = response.data;
      const newPinnedStatus = updatedChat.isPinned !== undefined ? updatedChat.isPinned : updatedChat.pinned;

      setChats(prevChats => 
        prevChats.map(c => c._id === chatId ? { ...c, pinned: newPinnedStatus } : c)
      );
    } catch (error) {
      console.error('Failed to pin chat:', error);
    }
  };

  const handleShareChat = (e, chat) => {
    e.stopPropagation();
    setOpenMenuChatId(null);
    const chatText = chat.messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
    navigator.clipboard.writeText(chatText);
    alert('🔗 Conversation copied to clipboard for sharing!');
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          type: file.type || 'text/plain',
          content: event.target.result
        });
      };
      
      if (file.type && file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const sendPromptWithAction = (actionType, actionPrefix) => {
    setCurrentAction(actionType);
    let lastCode = "";
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].sender === 'ai') {
        const match = chatHistory[i].text.match(/```[\s\S]*?```/);
        if (match) {
          lastCode = match[0];
          break;
        }
      }
    }
    setMessage(actionPrefix + (lastCode ? "\n\n" + lastCode : ""));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    let messageText = message;
    let filePayload = null;
    let fileName = null;

    if (selectedFile) {
      fileName = selectedFile.name;
      if (selectedFile.type && selectedFile.type.startsWith('image/')) {
        filePayload = {
          name: selectedFile.name,
          type: selectedFile.type,
          data: selectedFile.content.includes(',') ? selectedFile.content.split(',')[1] : selectedFile.content
        };
        messageText = message ? message : "Analyze this image in detail.";
      } else {
        filePayload = {
          name: selectedFile.name,
          type: selectedFile.type || 'text/plain',
          data: selectedFile.content
        };
        messageText = message ? message : `Analyze this code file (${selectedFile.name}) and explain or debug it.`;
      }
    }

    const userMsg = { sender: 'user', text: messageText, fileName: fileName };
    setChatHistory((prev) => [...prev, userMsg]);
    setLoading(true);
    setLoadingText(fileName ? `Analyzing ${fileName} silently...` : 'Thinking...');
    
    const currentMessage = messageText;
    const currentFilePayload = filePayload;
    const actionToSend = currentAction;
    
    setMessage('');
    setSelectedFile(null);
    setCurrentAction(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        userId,
        chatId: activeChatId,
        message: currentMessage,
        fileData: currentFilePayload,
        action: actionToSend,
        modelPreference: activeModel
      });

      const updatedChat = response.data.chat;
      
      if (response.data.modelUsed) {
        setActiveModel(response.data.modelUsed);
      }

      setChatHistory(updatedChat.messages);
      setActiveChatId(updatedChat._id);
      
      setChats((prevChats) => {
        const existing = prevChats.find(c => c._id === updatedChat._id);
        const pinnedState = existing ? existing.pinned : false;
        const filtered = prevChats.filter(c => c._id !== updatedChat._id);
        return [{ ...updatedChat, pinned: pinnedState }, ...filtered];
      });
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev, 
        { sender: 'ai', text: "⚠️ Unable to connect to the server. Please check if your backend server is running properly." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredChats.filter(c => c.pinned);
  const recentChatsList = filteredChats.filter(c => !c.pinned);

  return (
    <div className={`flex h-screen antialiased transition-colors duration-300 font-sans overflow-hidden ${
      darkMode ? 'bg-[#0e0e11] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      <Sidebar 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        handleNewChat={handleNewChat}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        pinnedChats={pinnedChats}
        recentChatsList={recentChatsList}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        editingChatId={editingChatId}
        setEditingChatId={setEditingChatId}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        handleRenameChat={handleRenameChat}
        openMenuChatId={openMenuChatId}
        setOpenMenuChatId={setOpenMenuChatId}
        handleShareChat={handleShareChat}
        handlePinChat={handlePinChat}
        handleDeleteChat={handleDeleteChat}
        user={user}
        handleLoginSuccess={handleLoginSuccess}
        handleLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        <ChatHeader darkMode={darkMode} activeModel={activeModel} />
        
        <ChatMessageList 
          chatHistory={chatHistory}
          darkMode={darkMode}
          loading={loading}
          loadingText={loadingText}
        />

        <ChatInput 
          darkMode={darkMode}
          sendPromptWithAction={sendPromptWithAction}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          sendMessage={sendMessage}
          message={message}
          setMessage={setMessage}
          loading={loading}
          activeModel={activeModel}
          setActiveModel={setActiveModel}
        />

        {showDiffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`w-full max-w-5xl p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Code Changes (Diff View)</h3>
                <button 
                  onClick={() => setShowDiffModal(false)}
                  className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-semibold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
              
              <CodeDiffView 
                originalCode={originalCode} 
                modifiedCode={modifiedCode} 
                language="javascript" 
                darkMode={darkMode} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;