import React, { useState } from 'react';

const ChatInput = ({
  darkMode,
  sendPromptWithAction,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  handleFileSelect,
  sendMessage,
  message,
  setMessage,
  loading,
  activeModel,
  setActiveModel
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const availableModels = [
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', badge: '🟢 PRIMARY' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', badge: '⚡ SECONDARY' },
    { id: 'gemini-3.5-flash-lite', name: 'Flash Lite', badge: '🚀 LITE' }
  ];

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Your browser does not support voice recognition. Please use Google Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setMessage((prev) => (prev ? prev + ' ' + speechText : speechText));
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <footer className={`p-4 md:p-5 sticky bottom-0 ${darkMode ? 'bg-gradient-to-t from-[#0e0e11] via-[#0e0e11]/95 to-transparent' : 'bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent'}`}>
      <div className="w-full max-w-4xl mx-auto px-4 relative">
        
        {/* Quick Action Buttons - Single Row */}
        <div className="flex items-center flex-nowrap justify-start md:justify-center gap-1.5 mb-3 overflow-x-auto w-full max-w-full scrollbar-none">
          <button onClick={() => sendPromptWithAction('debug', "Debug and find errors in this code: ")} className={`px-2 py-1 rounded-full text-[11px] md:text-chat-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-cyan-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-blue-600 hover:bg-slate-100 shadow-sm'}`}>
            🐛 Debug Code
          </button>
          <button onClick={() => sendPromptWithAction('optimize', "Optimize performance for this code: ")} className={`px-2 py-1 rounded-full text-[11px] md:text-chat-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-emerald-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-emerald-600 hover:bg-slate-100 shadow-sm'}`}>
            ⚡ Optimize
          </button>
          <button onClick={() => sendPromptWithAction('add-comments', "Add clean documentation comments to this code: ")} className={`px-2 py-1 rounded-full text-[11px] md:text-chat-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-amber-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-amber-600 hover:bg-slate-100 shadow-sm'}`}>
            📝 Add Comments
          </button>
          <button onClick={() => sendPromptWithAction('explain', "Explain how this code works step by step: ")} className={`px-2 py-1 rounded-full text-[11px] md:text-chat-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-indigo-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-indigo-600 hover:bg-slate-100 shadow-sm'}`}>
            🔍 Explain Code
          </button>
          <button onClick={() => sendPromptWithAction('compare', "Please compare the original code and the updated code:")} className={`px-2 py-1 rounded-full text-[11px] md:text-chat-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-purple-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-purple-600 hover:bg-slate-100 shadow-sm'}`}>
            🔄 Compare Code
          </button>
          <button onClick={() => sendPromptWithAction('unit-test', "Generate comprehensive unit tests for this code: ")} className={`px-2 py-1 rounded-full text-[11px] md:text-chat-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-purple-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-purple-600 hover:bg-slate-100 shadow-sm'}`}>
            🧪 Unit Test
          </button>
          <button onClick={() => sendPromptWithAction('security-scan', "Scan security vulnerabilities in this code: ")} className={`px-2 py-1 rounded-full text-[11px] md:text-chat-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-rose-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-rose-600 hover:bg-slate-100 shadow-sm'}`}>
            🛡️ Security Scan
          </button>
          <button onClick={() => sendPromptWithAction('api-docs', "Generate API documentation for this code: ")} className={`px-2 py-1 rounded-full text-[11px] md:text-chat-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-teal-400 hover:bg-zinc-800' : 'bg-white border-slate-300 text-teal-600 hover:bg-slate-100 shadow-sm'}`}>
            📄 API Docs
          </button>
        </div>

        {selectedFile && (
          <div className={`absolute bottom-full mb-3 px-3.5 py-2 rounded-2xl border flex items-center gap-2.5 text-chat-sm shadow-xl backdrop-blur-md font-medium ${darkMode ? 'bg-zinc-900/95 border-zinc-700 text-cyan-300' : 'bg-white/95 border-slate-300 text-blue-700'}`}>
            <span>🖼️ Image/File Attached: <strong>{selectedFile.name}</strong></span>
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
              title="Upload File"
            >
              +
            </button>

            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-2 rounded-full text-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : darkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title={isListening ? "Listening..." : "Voice Input"}
            >
              🎙️
            </button>

            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder={isListening ? "Listening... Speak now..." : "Ask DevMate, speak, or upload file..."} 
              className="w-full bg-transparent border-none focus:outline-none text-chat-base font-medium px-2 placeholder:text-zinc-500"
            />

            {/* --- Model Selector Dropdown (Right side, before send button) --- */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  darkMode 
                    ? 'bg-zinc-900 border-zinc-700 text-cyan-400 hover:bg-zinc-800' 
                    : 'bg-slate-100 border-slate-300 text-blue-600 hover:bg-slate-200'
                }`}
                title="Select AI Model"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="max-w-[100px] truncate">{activeModel}</span>
                <span className="text-[10px]">▼</span>
              </button>

              {isModelDropdownOpen && (
                <div className={`absolute bottom-full right-0 mb-2 w-48 rounded-xl border shadow-2xl z-50 py-1.5 backdrop-blur-xl ${
                  darkMode ? 'bg-zinc-900/95 border-zinc-700 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'
                }`}>
                  <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Model</p>
                  {availableModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setActiveModel(m.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        activeModel === m.id 
                          ? (darkMode ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-500/10 text-blue-600 font-bold') 
                          : (darkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700')
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="text-[9px] opacity-70 shrink-0 ml-1">{m.badge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
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
  );
};

export default ChatInput;