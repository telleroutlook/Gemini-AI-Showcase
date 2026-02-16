import React, { useState } from 'react';
import { ChatSession } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onGoHome: () => void;
  currentView: 'home' | 'chat';
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat, 
  onDeleteSession,
  isOpen,
  onCloseMobile,
  onGoHome,
  currentView
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(session => {
    const term = searchTerm.toLowerCase();
    const titleMatch = session.title.toLowerCase().includes(term);
    return titleMatch;
  });

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`
          fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300 backdrop-blur-sm
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-[85vw] max-w-[300px] md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col
        transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header / Main Nav */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between md:hidden mb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Menu</h2>
            <button 
              onClick={onCloseMobile} 
              className="p-2 -mr-2 text-slate-400 hover:text-white active:scale-95 transition-transform"
            >
              <Icons.XMark />
            </button>
          </div>

          <button 
            onClick={() => {
              onGoHome();
              onCloseMobile();
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium active:scale-[0.98]
              ${currentView === 'home' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}
            `}
          >
            <Icons.Home />
            <span>Home</span>
          </button>

          <button 
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            <Icons.Plus />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <div className="relative group">
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search chats..."
               className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-9 pr-8 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
             />
             <div className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                 <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
               </svg>
             </div>
             {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2.5 p-1 text-slate-500 hover:text-slate-300"
                >
                  <Icons.XMark />
                </button>
             )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 border-t border-slate-900">
          <div className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            <span>History</span>
            {filteredSessions.length > 0 && (
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-400">{filteredSessions.length}</span>
            )}
          </div>
          
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-600 text-sm flex flex-col items-center gap-2">
              <span className="text-2xl opacity-20">💬</span>
              <span>No chat history yet.</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-600 text-sm">
              No results found.
            </div>
          ) : (
            filteredSessions.slice().sort((a, b) => b.updatedAt - a.updatedAt).map((session) => (
              <div 
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onCloseMobile();
                }}
                className={`
                  group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer text-sm transition-all
                  ${currentSessionId === session.id && currentView === 'chat'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Icons.Message />
                  <span className="truncate max-w-[140px]">
                    {session.title || 'New Conversation'}
                  </span>
                </div>
                
                <button
                  onClick={(e) => onDeleteSession(e, session.id)}
                  className={`
                    p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors
                    ${currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 md:opacity-100'}
                  `}
                  title="Delete chat"
                >
                  <Icons.Trash />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-900/20">
              AI
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">Gemini Pro User</p>
              <p className="text-xs text-slate-500 truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default Sidebar;