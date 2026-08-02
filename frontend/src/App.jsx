import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const userId = "987654321";

  // මැසේජ් එකක් ආපු සැනින් ස්වයංක්‍රීයව පහළට scroll වීම
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = { sender: 'user', text: message };
    setChatHistory((prev) => [...prev, userMsg]);
    setLoading(true);
    setMessage(''); // Input එක ක්ලියර් කිරීම
    
    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        userId,
        message
      });
      const aiMsg = { sender: 'ai', text: response.data.reply };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev, 
        { sender: 'ai', text: "⚠️ Server එක සම්බන්ධ කරගැනීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar (For clean layout) */}
      <aside className="w-64 bg-slate-900 hidden md:flex flex-col border-r border-slate-800 p-4">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            D
          </div>
          <span className="font-semibold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">DevMate Workspace</span>
        </div>
        <button className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 transition-colors rounded-xl border border-slate-700 text-sm font-medium flex items-center justify-center gap-2">
          <span>+</span> New Chat
        </button>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        
        {/* Header */}
        <header className="backdrop-blur-md bg-slate-900/50 p-4 border-b border-slate-800/60 sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                🤖
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-200">DevMate AI Engine</h1>
              <p className="text-xs text-emerald-400 font-medium">Gemini 3.5 Flash Active</p>
            </div>
          </div>
        </header>
        
        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl w-full mx-auto scrollbar-thin scrollbar-thumb-slate-800">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60 max-w-md mx-auto my-auto pt-24">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-lg font-medium text-slate-300 mb-2">ඔබගේ DevMate සහකරු සූදානම්</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                කේතීකරණය (Coding), දෝෂ සෙවීම් (Debugging) හෝ ඕනෑම තාක්ෂණික ගැටලුවක් මෙතනින් විමසන්න.
              </p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-md text-[15px] leading-relaxed border ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/30 rounded-br-none shadow-cyan-950/20' 
                    : 'bg-slate-900 text-slate-200 border-slate-800 rounded-bl-none prose prose-invert max-w-none'
                }`}>
                  {msg.sender === 'user' ? (
                    msg.text
                  ) : (
                    // AI Response එක Markdown එකක් ලෙස Render කිරීම (Code block support සමඟ)
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}) {
                          return (
                            <code className="bg-slate-950 px-1.5 py-0.5 rounded text-sm text-cyan-400 font-mono" {...props}>
                              {children}
                            </code>
                          )
                        },
                        pre({children}) {
                          return <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto my-3 font-mono text-sm">{children}</pre>
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Active Advanced Loading State */}
          {loading && (
            <div className="flex justify-start items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sm animate-spin">⏳</div>
              <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl rounded-tl-none space-y-2 max-w-[200px] w-full shadow-sm">
                <div className="h-2 bg-slate-800 rounded animate-pulse w-full"></div>
                <div className="h-2 bg-slate-800 rounded animate-pulse w-5/6"></div>
                <div className="h-2 bg-slate-800 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <footer className="bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-4 md:p-6 sticky bottom-0">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto relative flex items-center">
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="මැසේජ් එක මෙතන ටයිප් කරන්න..." 
              className="w-full bg-slate-900/90 backdrop-blur-sm border border-slate-800 focus:border-cyan-500/80 rounded-2xl pl-5 pr-16 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder-slate-500 text-slate-100 shadow-2xl"
            />
            <button 
              type="submit" 
              disabled={!message.trim() || loading}
              className="absolute right-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:hover:from-cyan-500 disabled:hover:to-blue-600 text-white font-medium p-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center"
            >
              Send 🚀
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-600 mt-2">DevMate AI can make mistakes. Verify important code blocks.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
