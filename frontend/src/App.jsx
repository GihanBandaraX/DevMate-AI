import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleLogin } from '@react-oauth/google';

function App() {
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Analyzing code silently...');
  const [currentAction, setCurrentAction] = useState(null); // බက်එන්ඩ් එකට යැවිය යුතු action එක ගබඩා කිරීමට
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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const userId = user ? user.email : "guest_user_12345";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/chats/${userId}`);
        const initializedChats = response.data.map(c => ({ ...c, pinned: c.pinned || false }));
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

  const handlePinChat = (e, chatId) => {
    e.stopPropagation();
    setOpenMenuChatId(null);
    setChats(chats.map(c => c._id === chatId ? { ...c, pinned: !c.pinned } : c));
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

  // Quick Action බොත්තම් ක්ලික් කළ විට අදාළ action එක සහ ප්‍රොම්ප්ට් එක සකස් කිරීම
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
    const actionToSend = currentAction; // තෝරාගත් action එක යැවීමට සුදානම් කිරීම
    
    setMessage('');
    setSelectedFile(null);
    setCurrentAction(null); // යැවීමෙන් පසු action එක රීසෙට් කරන්න
    
    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        userId,
        chatId: activeChatId,
        message: currentMessage,
        fileData: currentFilePayload,
        action: actionToSend // මෙතැනින් බက်එන්ඩ් එකට action එක යැවේ
      });

      const updatedChat = response.data.chat;
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
      
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} hidden md:flex flex-col border-r p-4 justify-between transition-all duration-300 ${
        darkMode ? 'bg-[#131316] border-zinc-800/80' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col h-full overflow-hidden">
          
          <div className="flex items-center justify-between px-2 py-3 mb-3">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 text-sm">
                  ✦
                </div>
                <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  DevMate AI
                </span>
              </div>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title="Toggle Sidebar"
            >
              📋
            </button>
          </div>

          <button 
            onClick={handleNewChat}
            className={`w-full py-3 px-4 mb-4 transition-all rounded-2xl border text-chat-sm font-semibold flex items-center gap-3 shadow-sm ${
            darkMode 
              ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-slate-200' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
          }`}>
            <span className="text-base">✏️</span>
            {!sidebarCollapsed && <span>New chat</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="relative mb-4 px-1">
              <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-xs text-slate-400">🔍</span>
              <input 
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-chat-sm rounded-xl pl-10 pr-3 py-2.5 border focus:outline-none transition-all ${
                  darkMode ? 'bg-zinc-900/60 border-zinc-800 text-slate-200 focus:border-cyan-500/60 placeholder-zinc-500' : 'bg-slate-100/70 border-slate-200 text-slate-800 focus:border-blue-500/60 placeholder-slate-400'
                }`}
              />
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700">
              {pinnedChats.length > 0 && (
                <div>
                  <p className="text-chat-xs font-bold text-slate-400 uppercase px-2 mb-1.5 tracking-wider">Pinned</p>
                  <div className="space-y-1">
                    {pinnedChats.map((chat) => (
                      <div 
                        key={chat._id}
                        onClick={() => { setActiveChatId(chat._id); setEditingChatId(null); }}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-chat-sm cursor-pointer transition-all border ${
                          activeChatId === chat._id 
                            ? darkMode ? 'bg-zinc-900 border-zinc-700 text-cyan-400 font-semibold' : 'bg-slate-100 border-slate-300 text-blue-600 font-semibold'
                            : darkMode ? 'border-transparent text-slate-300 hover:bg-zinc-900/60' : 'border-transparent text-slate-700 hover:bg-slate-100/80'
                        }`}
                      >
                        {editingChatId === chat._id ? (
                          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="text"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              className={`w-full bg-transparent border rounded px-1.5 py-0.5 text-chat-sm focus:outline-none ${darkMode ? 'border-zinc-700 text-white' : 'border-slate-400 text-black'}`}
                              autoFocus
                            />
                            <button onClick={() => handleRenameChat(chat._id)} className="text-cyan-400 px-1">💾</button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate flex-1 pr-3">{chat.title}</span>
                            <button onClick={(e) => { e.stopPropagation(); setOpenMenuChatId(openMenuChatId === chat._id ? null : chat._id); }} className="opacity-0 group-hover:opacity-100 hover:text-cyan-400 p-1 rounded transition-opacity">⋮</button>
                            {openMenuChatId === chat._id && (
                              <div className={`absolute right-2 top-full mt-1 w-44 rounded-xl border shadow-2xl z-30 py-1.5 text-chat-sm backdrop-blur-md ${darkMode ? 'bg-zinc-900 border-zinc-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                                <button onClick={(e) => handleShareChat(e, chat)} className="w-full text-left px-3.5 py-2 hover:bg-cyan-500/10 flex items-center gap-2">🔗 Share conversation</button>
                                <button onClick={(e) => handlePinChat(e, chat._id)} className="w-full text-left px-3.5 py-2 hover:bg-cyan-500/10 flex items-center gap-2">📌 Unpin</button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingChatId(chat._id); setNewTitle(chat.title); setOpenMenuChatId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-cyan-500/10 flex items-center gap-2">✏️ Rename</button>
                                <button onClick={(e) => handleDeleteChat(e, chat._id)} className="w-full text-left px-3.5 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2">🗑️ Delete</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-chat-xs font-bold text-slate-400 uppercase px-2 mb-1.5 tracking-wider">Recent</p>
                <div className="space-y-1">
                  {recentChatsList.map((chat) => (
                    <div 
                      key={chat._id}
                      onClick={() => { setActiveChatId(chat._id); setEditingChatId(null); }}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-chat-sm cursor-pointer transition-all border ${
                        activeChatId === chat._id 
                          ? darkMode ? 'bg-zinc-900 border-zinc-700 text-cyan-400 font-semibold' : 'bg-slate-100 border-slate-300 text-blue-600 font-semibold'
                          : darkMode ? 'border-transparent text-slate-300 hover:bg-zinc-900/60 hover:text-slate-100' : 'border-transparent text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      {editingChatId === chat._id ? (
                        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className={`w-full bg-transparent border rounded px-1.5 py-0.5 text-chat-sm focus:outline-none ${darkMode ? 'border-zinc-700 text-white' : 'border-slate-400 text-black'}`}
                            autoFocus
                          />
                          <button onClick={() => handleRenameChat(chat._id)} className="text-cyan-400 px-1">💾</button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate flex-1 pr-3">{chat.title}</span>
                          <button onClick={(e) => { e.stopPropagation(); setOpenMenuChatId(openMenuChatId === chat._id ? null : chat._id); }} className="opacity-0 group-hover:opacity-100 hover:text-cyan-400 p-1 rounded transition-opacity">⋮</button>
                          {openMenuChatId === chat._id && (
                            <div className={`absolute right-2 top-full mt-1 w-44 rounded-xl border shadow-2xl z-30 py-1.5 text-chat-sm backdrop-blur-md ${darkMode ? 'bg-zinc-900 border-zinc-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                              <button onClick={(e) => handleShareChat(e, chat)} className="w-full text-left px-3.5 py-2 hover:bg-cyan-500/10 flex items-center gap-2">🔗 Share conversation</button>
                              <button onClick={(e) => handlePinChat(e, chat._id)} className="w-full text-left px-3.5 py-2 hover:bg-cyan-500/10 flex items-center gap-2">📌 Pin</button>
                              <button onClick={(e) => { e.stopPropagation(); setEditingChatId(chat._id); setNewTitle(chat.title); setOpenMenuChatId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-cyan-500/10 flex items-center gap-2">✏️ Rename</button>
                              <button onClick={(e) => handleDeleteChat(e, chat._id)} className="w-full text-left px-3.5 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2">🗑️ Delete</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`border-t pt-3 mt-2 ${darkMode ? 'border-zinc-800/80' : 'border-slate-200'}`}>
          {!sidebarCollapsed ? (
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-full py-2 px-3 rounded-xl border text-chat-sm transition-colors flex items-center justify-center gap-2 font-medium ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>

              {user ? (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-cyan-500/30 object-cover" />
                    <div className="text-chat-xs overflow-hidden">
                      <p className={`font-semibold truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user.name}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} title="Sign Out" className="text-red-400 hover:text-red-300 text-chat-xs px-2.5 py-1 rounded-lg bg-red-500/10 transition-colors font-semibold shrink-0">Logout</button>
                </div>
              ) : (
                <div className="flex justify-center w-full pt-1">
                  <GoogleLogin onSuccess={handleLoginSuccess} onError={() => console.log('Login Failed')} size="medium" theme={darkMode ? "filled_black" : "outline"} shape="pill" locale="en" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl text-amber-400 hover:bg-zinc-800 text-base" title="Toggle Theme">{darkMode ? '☀️' : '🌙'}</button>
              {user && <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-cyan-500/30 object-cover" title={user.name} />}
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        <header className={`backdrop-blur-md p-3.5 border-b sticky top-0 z-10 flex items-center justify-between px-6 transition-colors duration-300 ${
          darkMode ? 'bg-[#0e0e11]/80 border-zinc-800' : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border text-base ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>🤖</div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"></span>
            </div>
            <div>
              <h1 className={`text-chat-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>DevMate AI Engine</h1>
              <p className="text-chat-xs text-emerald-400 font-semibold">Gemini 3.5 Flash Active + Dev Tools</p>
            </div>
          </div>
        </header>
        
        {/* Chat History Container */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6 max-w-4xl w-full mx-auto ${
          darkMode 
            ? '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0e0e11] [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700' 
            : '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400'
        }`}>
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-70 max-w-md mx-auto my-auto pt-24">
              <div className="text-5xl mb-3">✨</div>
              <h2 className={`text-lg font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Ask DevMate</h2>
              <p className={`text-chat-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Type your message below, upload code/images, or use quick shortcuts to begin.</p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[95%] px-5 py-4 rounded-2xl shadow-xl text-chat-base leading-relaxed border transition-all ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/30 rounded-br-none shadow-cyan-950/25 font-normal' 
                    : darkMode ? 'bg-[#18181c]/95 text-slate-100 border-zinc-800 rounded-bl-none shadow-black/60' : 'bg-white text-slate-800 border-slate-200 rounded-bl-none shadow-md'
                }`}>
                  {msg.sender === 'user' ? (
                    <div>
                      {msg.fileName && (
                        <div className="mb-2 px-3 py-1.5 rounded-lg bg-black/25 text-xs flex items-center gap-2 border border-white/20 font-medium">
                          <span>📁</span>
                          <span className="truncate">{msg.fileName}</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ) : (
                    <div className="document-template space-y-3.5">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            const [copied, setCopied] = useState(false);
                            const [downloaded, setDownloaded] = useState(false);
                            const [activeTab, setActiveTab] = useState('code');

                            const isWebLanguage = match && ['html', 'css', 'javascript', 'js'].includes(match[1].toLowerCase());

                            const handleCopy = () => {
                              navigator.clipboard.writeText(codeString);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            };

                            const handleDownloadFile = () => {
                              const lang = match ? match[1].toLowerCase() : 'txt';
                              const extensionMap = {
                                html: 'html', htm: 'html', css: 'css',
                                javascript: 'js', js: 'js', jsx: 'jsx',
                                typescript: 'ts', ts: 'ts', tsx: 'tsx',
                                python: 'py', py: 'py', pyw: 'pyw',
                                java: 'java', jar: 'jar', csharp: 'cs', cs: 'cs',
                                php: 'php', ruby: 'rb', rb: 'rb', go: 'go',
                                rust: 'rs', rs: 'rs', cpp: 'cpp', c: 'c', h: 'h',
                                shell: 'sh', bash: 'sh', powershell: 'ps1',
                                json: 'json', markdown: 'md', md: 'md', txt: 'txt'
                              };

                              const ext = extensionMap[lang] || lang || 'txt';
                              const blob = new Blob([codeString], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `code_output.${ext}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              setDownloaded(true);
                              setTimeout(() => setDownloaded(false), 2000);
                            };

                            if (inline) {
                              return <code className={`px-1.5 py-0.5 rounded text-chat-sm font-semibold custom-code-font ${darkMode ? 'bg-zinc-800 text-cyan-300 border border-zinc-700' : 'bg-slate-100 text-blue-600 border border-slate-200'}`} {...props}>{children}</code>;
                            }

                            return (
                              <div className="relative group my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl max-h-[550px] flex flex-col">
                                <div className="sticky top-0 z-20 flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 text-chat-xs font-semibold shrink-0">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                                    <span className="text-cyan-400 font-bold ml-1.5 custom-code-font">{match ? match[1].toUpperCase() : 'SOURCE CODE'}</span>
                                    
                                    {isWebLanguage && (
                                      <div className="flex bg-zinc-800 rounded-lg p-0.5 ml-3">
                                        <button 
                                          onClick={() => setActiveTab('code')}
                                          className={`px-2 py-0.5 rounded text-[11px] font-sans ${activeTab === 'code' ? 'bg-cyan-500 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                                        >
                                          Code
                                        </button>
                                        <button 
                                          onClick={() => setActiveTab('preview')}
                                          className={`px-2 py-0.5 rounded text-[11px] font-sans ${activeTab === 'preview' ? 'bg-cyan-500 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                                        >
                                          ▶ Preview
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={handleDownloadFile} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all text-chat-xs shadow-sm cursor-pointer active:scale-95 font-sans font-medium">{downloaded ? '✅ Saved!' : '📥 Download'}</button>
                                    <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all text-chat-xs shadow-sm cursor-pointer active:scale-95 font-sans font-medium">{copied ? '✅ Copied!' : '📋 Copy'}</button>
                                  </div>
                                </div>

                                {activeTab === 'preview' && isWebLanguage ? (
                                  <div className="w-full h-80 bg-white p-2">
                                    <iframe 
                                      srcDoc={codeString}
                                      title="Live Preview"
                                      sandbox="allow-scripts"
                                      className="w-full h-full border-none rounded"
                                    />
                                  </div>
                                ) : (
                                  <div className="overflow-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-zinc-950 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                                    <pre className="p-4 text-code-base text-slate-200 leading-relaxed bg-black/70 custom-code-font m-0" {...props}><code>{children}</code></pre>
                                  </div>
                                )}
                              </div>
                            );
                          },
                          p({children}) { return <p className={`leading-relaxed mb-3.5 text-chat-base font-normal tracking-wide ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{children}</p>; },
                          h1({children}) { return <div className={`border-b pb-2 mb-3 mt-5 ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}><h1 className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">{children}</h1></div>; },
                          h2({children}) { return <div className={`flex items-center gap-2 font-bold text-lg mt-5 mb-2.5 pb-1.5 border-b border-dashed ${darkMode ? 'text-cyan-300 border-zinc-800' : 'text-blue-700 border-slate-200'}`}><span className="text-sm">📌</span><span>{children}</span></div>; },
                          h3({children}) { return <div className={`p-3 rounded-xl border my-3 font-bold text-base flex items-center gap-2.5 shadow-sm ${darkMode ? 'bg-zinc-900/80 border-zinc-800 text-cyan-400' : 'bg-slate-50 border-slate-200 text-blue-800'}`}><span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span><span>{children}</span></div>; },
                          strong({children}) { return <strong className={`font-bold ${darkMode ? 'text-cyan-300' : 'text-blue-700'}`}>{children}</strong>; },
                          ul({children}) { return <ul className={`list-disc pl-5 space-y-1.5 mb-3.5 marker:text-cyan-500 text-chat-base ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{children}</ul>; },
                          ol({children}) { return <ol className={`list-decimal pl-5 space-y-1.5 mb-3.5 marker:text-cyan-500 font-medium text-chat-base ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{children}</ol>; },
                          li({children}) { return <li className="leading-relaxed pl-1">{children}</li>; },
                          table({children}) { return <div className={`overflow-x-auto my-4 rounded-xl border shadow-lg ${darkMode ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-200 bg-white'}`}><table className="w-full border-collapse text-left text-chat-sm">{children}</table></div>; },
                          thead({children}) { return <thead className={darkMode ? 'bg-zinc-900 text-cyan-400 border-b border-zinc-800' : 'bg-slate-100 text-blue-800 border-b border-slate-200'}>{children}</thead>; },
                          th({children}) { return <th className="px-4 py-3 font-bold tracking-wider">{children}</th>; },
                          td({children}) { return <td className={`px-4 py-3 border-b ${darkMode ? 'border-zinc-900 text-slate-300' : 'border-slate-100 text-slate-700'}`}>{children}</td>; },
                          img({src, alt}) { return <div className="my-4 flex flex-col items-center"><img src={src} alt={alt} className="rounded-xl border border-zinc-700 max-h-80 object-cover shadow-xl" />{alt && <span className="text-chat-xs text-slate-400 mt-1.5 italic font-medium">📷 {alt}</span>}</div>; },
                          blockquote({children}) { return <div className={`border-l-4 p-3.5 my-3.5 rounded-r-xl border-y border-r shadow-inner ${darkMode ? 'border-cyan-500 text-slate-300 bg-cyan-950/20 border-cyan-900/30' : 'border-blue-500 text-slate-700 bg-blue-50/80 border-blue-200'}`}><div className="italic text-chat-base">{children}</div></div>; }
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start items-center gap-3">
              <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm animate-spin ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>⏳</div>
              <div className={`border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2.5 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-cyan-300' : 'bg-white border-slate-200 text-blue-700'}`}>
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                <span className="text-chat-sm font-semibold">{loadingText}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Prompt Box */}
        <footer className={`p-4 md:p-5 sticky bottom-0 ${darkMode ? 'bg-gradient-to-t from-[#0e0e11] via-[#0e0e11]/95 to-transparent' : 'bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent'}`}>
          <div className="max-w-4xl mx-auto relative">
            
            {/* Quick Action බොත්තම් මාලාව (Unit Test, Security Scan සහ API Docs සමඟ යාවත්කාලීන විය) */}
            <div className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              <button onClick={() => sendPromptWithAction('debug', "Debug and find errors in this code: ")} className={`px-3 py-1 rounded-full text-chat-xs font-semibold border transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-cyan-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-blue-600 hover:bg-slate-100'}`}>
                🐛 Debug Code
              </button>
              <button onClick={() => sendPromptWithAction('optimize', "Optimize performance for this code: ")} className={`px-3 py-1 rounded-full text-chat-xs font-semibold border transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-emerald-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-emerald-600 hover:bg-slate-100'}`}>
                ⚡ Optimize
              </button>
              <button onClick={() => sendPromptWithAction('add-comments', "Add clean documentation comments to this code: ")} className={`px-3 py-1 rounded-full text-chat-xs font-semibold border transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-amber-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-amber-600 hover:bg-slate-100'}`}>
                📝 Add Comments
              </button>
              <button onClick={() => sendPromptWithAction('explain', "Explain how this code works step by step: ")} className={`px-3 py-1 rounded-full text-chat-xs font-semibold border transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-indigo-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-indigo-600 hover:bg-slate-100'}`}>
                🔍 Explain Code
              </button>
              <button onClick={() => sendPromptWithAction('unit-test', "Generate comprehensive unit tests for this code: ")} className={`px-3 py-1 rounded-full text-chat-xs font-semibold border transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-purple-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-purple-600 hover:bg-slate-100'}`}>
                🧪 Unit Test
              </button>
              <button onClick={() => sendPromptWithAction('security-scan', "Scan security vulnerabilities in this code: ")} className={`px-3 py-1 rounded-full text-chat-xs font-semibold border transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-rose-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-rose-600 hover:bg-slate-100'}`}>
                🛡️ Security Scan
              </button>
              <button onClick={() => sendPromptWithAction('api-docs', "Generate API documentation for this code: ")} className={`px-3 py-1 rounded-full text-chat-xs font-semibold border transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-teal-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-teal-600 hover:bg-slate-100'}`}>
                📄 API Docs
              </button>
            </div>

            {selectedFile && (
              <div className={`absolute bottom-full mb-3 px-3.5 py-2 rounded-2xl border flex items-center gap-2.5 text-chat-sm shadow-xl backdrop-blur-md font-medium ${darkMode ? 'bg-zinc-900/95 border-zinc-700 text-cyan-300' : 'bg-white/95 border-slate-300 text-blue-700'}`}>
                <span>📁 File Attached: <strong>{selectedFile.name}</strong></span>
                <button type="button" onClick={() => setSelectedFile(null)} className="ml-2 text-red-400 hover:text-red-300 font-bold text-base cursor-pointer">✕</button>
              </div>
            )}

            <form onSubmit={sendMessage} className="relative flex items-center">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*,.html,.htm,.css,.js,.jsx,.ts,.tsx,.py,.pyw,.java,.jar,.cs,.php,.rb,.go,.rs,.cpp,.h,.hpp,.sh,.bash,.ps1,.pl,.lua,.sql,.graphql,.gql,.json,.txt,.md"
                className="hidden" 
              />

              <div className={`w-full flex items-center gap-2.5 backdrop-blur-md border rounded-full px-4 py-2.5 transition-all shadow-2xl ${darkMode ? 'bg-[#18181c]/90 border-zinc-700/80 focus-within:border-cyan-500 text-slate-100 shadow-black/40' : 'bg-white/90 border-slate-300 focus-within:border-cyan-500 text-slate-900 shadow-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 rounded-full text-xl transition-colors flex items-center justify-center shrink-0 cursor-pointer ${darkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'}`}
                  title="Upload Image or File"
                >
                  +
                </button>

                <input 
                  type="text" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Ask DevMate or choose quick action above..." 
                  className="w-full bg-transparent border-none focus:outline-none text-chat-base font-medium px-2 placeholder:text-zinc-500"
                />

                <button 
                  type="submit" 
                  disabled={(!message.trim() && !selectedFile) || loading}
                  className="shrink-0 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-full text-chat-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  Send 🚀
                </button>
              </div>
            </form>
          </div>
          <p className="text-center text-chat-xs text-slate-500 mt-2.5 font-medium">DevMate AI can make mistakes. Verify important code blocks.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;