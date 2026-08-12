import React from 'react';

const ChatHeader = ({ darkMode, activeModel = "gemini-3.6-flash" }) => {
  return (
    <header className={`backdrop-blur-md p-4 border-b sticky top-0 z-10 flex items-center justify-between px-6 transition-colors duration-300 ${
      darkMode ? 'bg-[#0e0e11]/80 border-zinc-800' : 'bg-white/80 border-slate-200'
    }`}>
      {/* Tech & Futuristic Font Imports (Michroma & Sansation) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Michroma&family=Sansation&display=swap');
        .font-michroma {
          font-family: 'Michroma', sans-serif;
        }
        .font-sansation {
          font-family: 'Sansation', cursive;
        }
      `}</style>

      <div className="flex items-center gap-4">
        <div className="relative">
          {/* logo */}
          <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center border shadow-md shrink-0 ${
            darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'
          }`}>
            <img 
              src="/logo.jpeg" 
              alt="DevMate Logo" 
              className="w-full h-full object-cover"
              onError={(e) => { 
                e.target.style.display = 'none'; 
                e.target.nextSibling.style.display = 'flex'; 
              }}
            />
            <span className="hidden text-base font-michroma">✦</span>
          </div>
        </div>
        
        <div>
          {/* Michroma Font for Title */}
          <h1 className={`text-base font-extrabold tracking-wider font-michroma ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            DevMate AI<span className="text-cyan-400 font-semibold"></span>
          </h1>
          
          {/* Sansation font for Active Model */}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[12px] text-emerald-400 font-Sansation">
              <b>ACTIVE:</b> {activeModel.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;