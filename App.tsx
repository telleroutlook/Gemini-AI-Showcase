import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';
import Hero from './components/Hero';
import ModelShowcase from './components/ModelShowcase';
import Footer from './components/Footer';
import { ChatSession, ChatMessage, Attachment, SessionConfig } from './types';
import { createChatSession, streamChatMessage } from './services/geminiService';
import { Chat } from '@google/genai';
import { AVAILABLE_MODELS, Icons } from './constants';
import { AnimatePresence, motion } from 'motion/react';

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<'home' | 'chat'>('home'); // 'home' or 'chat'
  
  // Use 'gemini-3-flash-preview' as default
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  
  const chatInstanceRef = useRef<Chat | null>(null);
  const isGeneratingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load from local storage on init
  useEffect(() => {
    const saved = localStorage.getItem('gemini-chat-sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('gemini-chat-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Re-initialize Gemini Chat object when session ID OR Model changes
  useEffect(() => {
    if (currentSessionId && view === 'chat') {
      const currentSession = sessions.find(s => s.id === currentSessionId);
      if (currentSession) {
        try {
          if (currentSession.modelId && currentSession.modelId !== selectedModel) {
            setSelectedModel(currentSession.modelId);
          }
          chatInstanceRef.current = createChatSession(
            currentSession.messages, 
            currentSession.modelId || selectedModel,
            currentSession.config 
          );
        } catch (e) {
          console.error("Error initializing chat context", e);
        }
      }
    }
  }, [currentSessionId, selectedModel, sessions, view]);

  const createNewSession = () => {
    // Optimization: If current session is empty, just use it instead of creating new
    if (currentSessionId) {
      const currentSession = sessions.find(s => s.id === currentSessionId);
      if (currentSession && currentSession.messages.length === 0) {
        setIsSidebarOpen(false);
        return;
      }
    }

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      modelId: selectedModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: {
        temperature: 1.0,
        systemInstruction: '',
        useSearch: true // Default to true
      }
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setView('chat');
    setIsSidebarOpen(false); 
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    
    if (currentSessionId === id) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        setCurrentSessionId(null);
        setView('home'); // Go home if all deleted
      }
    }
    
    if (newSessions.length === 0) {
       localStorage.removeItem('gemini-chat-sessions');
    } else {
       localStorage.setItem('gemini-chat-sessions', JSON.stringify(newSessions));
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setView('chat');
  };

  const handleGoHome = () => {
    setView('home');
    setCurrentSessionId(null);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    if (currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, modelId } : s
      ));
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isGeneratingRef.current = false;
    setIsLoading(false);
  };

  const handleSaveSettings = (newConfig: SessionConfig) => {
    if (currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, config: newConfig } : s
      ));
    }
  };

  const handleExportChat = () => {
    if (!currentSessionId) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const exportText = session.messages.map(m => {
      const role = m.role === 'user' ? 'User' : 'Gemini';
      const time = new Date(m.timestamp).toLocaleString();
      return `### ${role} (${time})\n\n${m.text}\n\n`;
    }).join('---\n\n');

    const blob = new Blob(['\uFEFF' + exportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const safeTitle = session.title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_').trim();
    const filename = safeTitle || `chat_${session.id}`;

    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditMessage = (index: number, newText: string) => {
    if (!currentSessionId) return;
    
    setSessions(prev => {
      const session = prev.find(s => s.id === currentSessionId);
      if (!session) return prev;
      
      const newMessages = session.messages.slice(0, index);
      
      return prev.map(s => s.id === currentSessionId ? { ...s, messages: newMessages } : s);
    });

    setTimeout(() => {
      handleSendMessage(newText, []);
    }, 50);
  };

  const handleRegenerate = async () => {
    if (!currentSessionId || isLoading) return;
    
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session || session.messages.length === 0) return;

    const lastMsg = session.messages[session.messages.length - 1];
    if (lastMsg.role !== 'model') return;

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: s.messages.slice(0, -1) };
      }
      return s;
    }));

    const lastUserMsgIndex = session.messages.length - 2;
    if (lastUserMsgIndex >= 0) {
      const lastUserMsg = session.messages[lastUserMsgIndex];
      
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: s.messages.slice(0, -2) };
        }
        return s;
      }));

      setTimeout(() => {
        const attachments = lastUserMsg.attachments || 
          ((lastUserMsg as any).images ? (lastUserMsg as any).images.map((img: string) => ({ type: 'image', mimeType: 'image/jpeg', data: img })) : undefined);
        handleSendMessage(lastUserMsg.text, attachments); 
      }, 0);
    }
  };

  const handleSendMessage = async (text: string, attachments?: Attachment[]) => {
    let activeSessionId = currentSessionId;
    if (!activeSessionId || view === 'home') {
       const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        modelId: selectedModel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: { temperature: 1.0, systemInstruction: '', useSearch: true }
      };
      setSessions(prev => [newSession, ...prev]);
      activeSessionId = newSession.id;
      setCurrentSessionId(activeSessionId);
      setView('chat');
    }

    const startTime = Date.now();
    const userMsg: ChatMessage = { 
      role: 'user', 
      text, 
      attachments: attachments || [],
      timestamp: startTime 
    };
    
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        let title = session.title;
        if (session.messages.length === 0) {
           title = text.slice(0, 30) + (text.length > 30 ? '...' : '') || 'New Chat';
        }
        return {
          ...session,
          title,
          messages: [...session.messages, userMsg],
          updatedAt: Date.now()
        };
      }
      return session;
    }));

    setIsLoading(true);
    isGeneratingRef.current = true;
    abortControllerRef.current = new AbortController();

    // Initialize placeholder with timing info
    const placeholderMsg: ChatMessage = { 
      role: 'model', 
      text: '', 
      timestamp: Date.now(),
      timing: { startTime } 
    };
    
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        return { ...session, messages: [...session.messages, placeholderMsg] };
      }
      return session;
    }));

    try {
      const currentSession = sessions.find(s => s.id === activeSessionId);
      const sessionModelId = currentSession?.modelId || selectedModel;
      
      chatInstanceRef.current = createChatSession(
           currentSession?.messages || [], 
           sessionModelId,
           currentSession?.config
      );
      
      const useSearch = currentSession?.config?.useSearch ?? true;
      
      // streamChatMessage now performs a single atomic fetch (non-streaming internally)
      // but yields the result in a compatible format
      const stream = streamChatMessage(
        chatInstanceRef.current, 
        text, 
        attachments, 
        useSearch,
        abortControllerRef.current.signal
      );
      
      let fullText = "";
      let groundingMetadata: any = null;
      let usageMetadata: any = null;
      let finalSuggestions: string[] = [];

      for await (const chunk of stream) {
        if (!isGeneratingRef.current) break;

        // chunk.text is now the parsed 'answer' field from the JSON
        if (chunk.text) fullText = chunk.text;
        
        if (chunk.candidates?.[0]?.groundingMetadata) {
          groundingMetadata = chunk.candidates[0].groundingMetadata;
        }
        if (chunk.usageMetadata) {
          usageMetadata = chunk.usageMetadata;
        }
        if ((chunk as any).suggestions) {
          finalSuggestions = (chunk as any).suggestions;
        }
        
        // Update immediately since it's a single chunk
        setSessions(prev => updateSessionMessage(
            prev, 
            activeSessionId!, 
            fullText, 
            groundingMetadata, 
            usageMetadata, 
            finalSuggestions
        ));
      }

      // Final Timing Update
      setSessions(prev => {
         return prev.map(session => {
            if (session.id === activeSessionId) {
              const msgs = [...session.messages];
              const lastMsgIndex = msgs.length - 1;
              const lastMsg = { ...msgs[lastMsgIndex] };

              if (lastMsg.role === 'model' && lastMsg.timing) {
                 const endTime = Date.now();
                 lastMsg.timing = {
                   ...lastMsg.timing,
                   endTime,
                   duration: endTime - lastMsg.timing.startTime
                 };
                 msgs[lastMsgIndex] = lastMsg;
              }
              return { ...session, messages: msgs };
            }
            return session;
         });
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(error);
        const errorMsg = "\n[Error: Could not generate response. Please check API Key.]";
        setSessions(prev => prev.map(session => {
          if (session.id === activeSessionId) {
            const msgs = [...session.messages];
            const lastMsg = { ...msgs[msgs.length - 1] };
            lastMsg.text += errorMsg;
            msgs[msgs.length - 1] = lastMsg;
            return { ...session, messages: msgs };
          }
          return session;
        }));
      }
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  // Helper function for immutable updates
  const updateSessionMessage = (
    sessions: ChatSession[], 
    sessionId: string, 
    text: string, 
    grounding: any, 
    usage: any,
    suggestions: string[] = []
  ) => {
    return sessions.map(session => {
      if (session.id === sessionId) {
        const msgs = [...session.messages];
        const lastMsgIndex = msgs.length - 1;
        
        // Ensure we are updating a model message
        if (msgs[lastMsgIndex].role === 'model') {
           const lastMsg = { ...msgs[lastMsgIndex] };
           lastMsg.text = text;
           if (grounding) lastMsg.groundingMetadata = grounding;
           if (usage) lastMsg.usageMetadata = usage;
           if (suggestions.length > 0) lastMsg.suggestions = suggestions;
           msgs[lastMsgIndex] = lastMsg;
        }
        return { ...session, messages: msgs };
      }
      return session;
    });
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentSessionMessages = currentSession?.messages || [];

  return (
    <div className="flex h-[100dvh] bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onGoHome={handleGoHome}
        currentView={view}
      />
      
      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <motion.div 
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 bg-slate-900 relative"
          >
            <div className="md:hidden absolute top-4 left-4 z-20">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 bg-slate-800 rounded-lg text-slate-200 shadow-lg border border-slate-700"
                aria-label="Open Menu"
              >
                <Icons.Menu />
              </button>
            </div>
            <Hero onStartChat={createNewSession} />
            <ModelShowcase />
            <Footer />
          </motion.div>
        ) : (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 h-full flex flex-col"
          >
            <ChatInterface 
              messages={currentSessionMessages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onMobileMenuToggle={() => setIsSidebarOpen(true)}
              onStopGeneration={handleStopGeneration}
              onRegenerate={handleRegenerate}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              onOpenSettings={() => setShowSettings(true)}
              onExportChat={handleExportChat}
              onEditMessage={handleEditMessage}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {currentSession && view === 'chat' && (
        <SettingsModal 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          config={currentSession.config || { temperature: 1.0, systemInstruction: '', useSearch: true }}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}

export default App;