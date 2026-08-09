import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { GoSidebarCollapse, GoSidebarExpand } from 'react-icons/go';

const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  darkMode,
  setDarkMode,
  handleNewChat,
  searchQuery,
  setSearchQuery,
  pinnedChats,
  recentChatsList,
  activeChatId,
  setActiveChatId,
  editingChatId,
  setEditingChatId,
  newTitle,
  setNewTitle,
  handleRenameChat,
  openMenuChatId,
  setOpenMenuChatId,
  handleShareChat,
  handlePinChat,
  handleDeleteChat,
  user,
  handleLoginSuccess,
  handleLogout
}) => {
  return (
    <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} hidden md:flex flex-col border-r p-3.5 justify-between transition-all duration-300 font-sansation text-sm ${
      darkMode ? 'bg-[#0f0f12] border-zinc-800/80' : 'bg-slate-50/70 border-slate-200'
    }`}>
      {/* Theme-optimized Futuristic Glow Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Michroma&family=Sansation&display=swap');
        .font-michroma {
          font-family: 'Michroma', sans-serif;
        }
        .font-sansation {
          font-family: 'Sansation', cursive;
        }
        @keyframes neon-pulse-dark {
          0%, 100% {
            color: #22d3ee;
            text-shadow: 0 0 8px rgba(34, 211, 238, 0.6), 0 0 20px rgba(59, 130, 246, 0.4);
          }
          50% {
            color: #60a5fa;
            text-shadow: 0 0 15px rgba(34, 211, 238, 0.9), 0 0 30px rgba(168, 85, 247, 0.7);
          }
        }
        @keyframes neon-pulse-light {
          0%, 100% {
            color: #2563eb;
            text-shadow: 0 0 6px rgba(37, 99, 235, 0.3);
          }
          50% {
            color: #4f46e5;
            text-shadow: 0 0 12px rgba(79, 70, 229, 0.5);
          }
        }
        .futuristic-title-dark {
          animation: neon-pulse-dark 3s ease-in-out infinite;
        }
        .futuristic-title-light {
          animation: neon-pulse-light 3s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Header & Logo Section */}
        <div className="flex items-center justify-between px-1 py-2 mb-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center border shadow-md shrink-0 ${
                darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'
              }`}>
                <img 
                  src="/logo.jpeg" 
                  alt="DevMate Logo" 
                  className="w-full h-full object-cover scale-105"
                  onError={(e) => { 
                    e.target.style.display = 'none'; 
                    e.target.nextSibling.style.display = 'flex'; 
                  }}
                />
                <span className="hidden font-michroma text-cyan-400 text-base">✦</span>
              </div>
              {/* Theme-aware animated title */}
              <span className={`font-extrabold text-base tracking-wide font-michroma whitespace-nowrap ${
                darkMode ? 'futuristic-title-dark' : 'futuristic-title-light'
              }`}>
                DevMate AI
              </span>
            </div>
          ) : (
            <div className="mx-auto w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center border shadow-md shrink-0 bg-zinc-900 border-zinc-700">
              <img 
                src="/logo.jpeg" 
                alt="DevMate Logo" 
                className="w-full h-full object-cover scale-105"
                onError={(e) => { 
                  e.target.style.display = 'none'; 
                  e.target.nextSibling.style.display = 'flex'; 
                }}
              />
              <span className="hidden font-michroma text-cyan-400 text-base">✦</span>
            </div>
          )}
          
          {!sidebarCollapsed && (
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-xl border text-lg transition-all shrink-0 ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800 hover:text-cyan-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-blue-600'
              }`}
              title="Collapse Sidebar"
            >
              <GoSidebarCollapse />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <div className="flex justify-center mb-4">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2.5 rounded-xl border text-xl transition-all ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800 hover:text-cyan-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-blue-600'
              }`}
              title="Expand Sidebar"
            >
              <GoSidebarExpand />
            </button>
          </div>
        )}

        {/* New Chat Button */}
        <button 
          onClick={handleNewChat}
          className={`w-full py-3 px-4 mb-3 transition-all rounded-2xl border text-sm font-semibold flex items-center gap-3 shadow-sm font-sansation ${
          darkMode 
            ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-slate-200' 
            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <span className="text-lg">✏️</span>
          {!sidebarCollapsed && <span>New chat</span>}
        </button>

        {/* Search Bar */}
        {!sidebarCollapsed && (
          <div className="relative mb-4 px-0.5">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-sm text-slate-400">🔍</span>
            <input 
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-sm rounded-xl pl-10 pr-3 py-2.5 border focus:outline-none transition-all font-sansation ${
                darkMode ? 'bg-zinc-900/60 border-zinc-800 text-slate-200 focus:border-cyan-500/60 placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500/60 placeholder-slate-400 shadow-sm'
              }`}
            />
          </div>
        )}

        {/* Chat Lists (Pinned & Recent) */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 font-sansation">
            {pinnedChats && pinnedChats.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase px-2 mb-1.5 tracking-wider">Pinned</p>
                <div className="space-y-1">
                  {pinnedChats.map((chat) => (
                    <div 
                      key={chat._id}
                      onClick={() => { setActiveChatId(chat._id); setEditingChatId(null); }}
                      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all border ${
                        activeChatId === chat._id 
                          ? darkMode ? 'bg-zinc-900 border-zinc-700 text-cyan-400 font-semibold' : 'bg-white border-slate-300 text-blue-600 font-semibold shadow-sm'
                          : darkMode ? 'border-transparent text-slate-300 hover:bg-zinc-900/60' : 'border-transparent text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      {editingChatId === chat._id ? (
                        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className={`w-full bg-transparent border rounded px-1.5 py-0.5 text-sm focus:outline-none ${darkMode ? 'border-zinc-700 text-white' : 'border-slate-400 text-black'}`}
                            autoFocus
                          />
                          <button onClick={() => handleRenameChat(chat._id)} className="text-cyan-400 px-1">💾</button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate flex-1 pr-3 flex items-center gap-2">
                            <span className="text-sm">📌</span> {chat.title}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); setOpenMenuChatId(openMenuChatId === chat._id ? null : chat._id); }} className="opacity-0 group-hover:opacity-100 hover:text-cyan-400 p-1 rounded transition-opacity">⋮</button>
                          {openMenuChatId === chat._id && (
                            <div className={`absolute right-2 top-full mt-1 w-44 rounded-xl border shadow-2xl z-30 py-1.5 text-sm backdrop-blur-md ${darkMode ? 'bg-zinc-900 border-zinc-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
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
              <p className="text-xs font-bold text-slate-400 uppercase px-2 mb-1.5 tracking-wider">Recent</p>
              <div className="space-y-1">
                {recentChatsList && recentChatsList.map((chat) => (
                  <div 
                    key={chat._id}
                    onClick={() => { setActiveChatId(chat._id); setEditingChatId(null); }}
                    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all border ${
                      activeChatId === chat._id 
                        ? darkMode ? 'bg-zinc-900 border-zinc-700 text-cyan-400 font-semibold' : 'bg-white border-slate-300 text-blue-600 font-semibold shadow-sm'
                        : darkMode ? 'border-transparent text-slate-300 hover:bg-zinc-900/60 hover:text-slate-100' : 'border-transparent text-slate-700 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                  >
                    {editingChatId === chat._id ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className={`w-full bg-transparent border rounded px-1.5 py-0.5 text-sm focus:outline-none ${darkMode ? 'border-zinc-700 text-white' : 'border-slate-400 text-black'}`}
                          autoFocus
                        />
                        <button onClick={() => handleRenameChat(chat._id)} className="text-cyan-400 px-1">💾</button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate flex-1 pr-3">{chat.title}</span>
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuChatId(openMenuChatId === chat._id ? null : chat._id); }} className="opacity-0 group-hover:opacity-100 hover:text-cyan-400 p-1 rounded transition-opacity">⋮</button>
                        {openMenuChatId === chat._id && (
                          <div className={`absolute right-2 top-full mt-1 w-44 rounded-xl border shadow-2xl z-30 py-1.5 text-sm backdrop-blur-md ${darkMode ? 'bg-zinc-900 border-zinc-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
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

      {/* Footer Profile & Theme Switcher */}
      <div className={`border-t pt-3 mt-2 font-sansation ${darkMode ? 'border-zinc-800/80' : 'border-slate-200'}`}>
        {!sidebarCollapsed ? (
          <div className="flex flex-col gap-2.5">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full py-2.5 px-3 rounded-xl border text-sm transition-colors flex items-center justify-center gap-2 font-medium ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            {user ? (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-cyan-500/30 object-cover" />
                  <div className="text-sm overflow-hidden">
                    <p className={`font-semibold truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user.name}</p>
                  </div>
                </div>
                <button onClick={handleLogout} title="Sign Out" className="text-red-400 hover:text-red-300 text-xs px-2.5 py-1 rounded-lg bg-red-500/10 transition-colors font-semibold shrink-0">Logout</button>
              </div>
            ) : (
              <div className="flex justify-center w-full pt-1">
                <GoogleLogin onSuccess={handleLoginSuccess} onError={() => console.log('Login Failed')} size="medium" theme={darkMode ? "filled_black" : "outline"} shape="pill" locale="en" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl text-amber-400 hover:bg-zinc-800 text-lg" title="Toggle Theme">{darkMode ? '☀️' : '🌙'}</button>
            {user && <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-cyan-500/30 object-cover" title={user.name} />}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;