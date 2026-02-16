import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChatMessage, Attachment } from '../types';
import { Icons, AVAILABLE_MODELS } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  onMobileMenuToggle: () => void;
  onStopGeneration: () => void;
  onRegenerate: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onOpenSettings: () => void;
  onExportChat: () => void;
  onEditMessage?: (index: number, newText: string) => void;
}

// Extracted and Memoized Message Item Component for performance
const MessageItem = React.memo(({ 
  msg, 
  idx, 
  isEditing, 
  isLoading, 
  editInput, 
  setEditInput, 
  startEditing, 
  saveEdit, 
  setEditingMessageIndex,
  onRegenerate,
  handleSubmit,
  isLast,
  handleTTS
}: any) => {

  const getMessageAttachments = (msg: ChatMessage): Attachment[] => {
    if (msg.attachments) return msg.attachments;
    if ((msg as any).images && (msg as any).images.length > 0) {
      return (msg as any).images.map((img: string) => ({
        type: 'image',
        mimeType: 'image/jpeg',
        data: img
      }));
    }
    return [];
  };

  const atts = getMessageAttachments(msg);

  return (
    <div className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role === 'model' && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-1 hidden sm:flex shadow-lg shadow-indigo-900/20">
          <Icons.Sparkle />
        </div>
      )}
      
      <div className={`
        flex flex-col gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[80%] w-full
        ${msg.role === 'user' ? 'items-end' : 'items-start'}
      `}>
          {/* Render Attached Files */}
          {!isEditing && atts.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1 justify-end">
              {atts.map((att: any, i: number) => (
                <div key={i} className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/50 shadow-sm">
                  {att.type === 'image' ? (
                    <img 
                    src={`data:${att.mimeType};base64,${att.data}`} 
                    alt="Attached" 
                    className="w-48 h-auto object-cover max-h-64"
                  />
                  ) : (
                    <div className="p-3 flex items-center gap-3 min-w-[160px] max-w-[240px]">
                      <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icons.FileText />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-slate-200 truncate">{att.name || 'Document'}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{att.mimeType.split('/')[1] || 'FILE'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isEditing ? (
            <div className="w-full bg-slate-800 p-3 rounded-xl border border-slate-600 shadow-lg">
              <textarea
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 p-3 rounded-lg text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                rows={4}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setEditingMessageIndex(null)}
                  className="px-4 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => saveEdit(idx)}
                  className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-lg shadow-blue-900/20 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className={`group relative
            rounded-2xl px-4 py-3.5 shadow-sm overflow-hidden w-full
            ${msg.role === 'user' 
              ? 'bg-slate-700 text-white rounded-br-sm pr-10' 
              : 'bg-transparent text-slate-100 rounded-bl-sm -ml-2'}
          `}>
              {msg.role === 'user' ? (
                <>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                  {!isLoading && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditing(idx, msg.text)}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                        title="Edit message"
                        aria-label="Edit message"
                      >
                        <Icons.Pencil />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <MarkdownRenderer content={msg.text} />
                  
                  {/* Grounding Sources */}
                  {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-700/50">
                      <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Icons.Globe /> Sources
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                          chunk.web?.uri && (
                            <a 
                              key={i}
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-xs text-blue-400 hover:text-blue-300 transition-colors border border-slate-700"
                            >
                              <span className="truncate max-w-[150px]">{chunk.web.title || chunk.web.uri}</span>
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Usage & Timing Stats */}
                  {(msg.usageMetadata || msg.timing) && (
                    <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                      {msg.usageMetadata && (
                        <span title="Prompt / Candidates / Total Tokens">
                          TOKENS: {msg.usageMetadata.promptTokenCount} &uarr; {msg.usageMetadata.candidatesTokenCount} &darr; ({msg.usageMetadata.totalTokenCount})
                        </span>
                      )}
                      {msg.timing?.duration && (
                        <span title="Generation Time">
                          TIME: {(msg.timing.duration / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion: string, sIdx: number) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSubmit(undefined, suggestion)}
                          className="text-xs px-3 py-2 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-300 hover:border-blue-500/50 border border-slate-600/50 rounded-lg transition-all text-slate-300 active:scale-[0.98]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Model Action Buttons */}
                  <div className="mt-2 flex items-center gap-1 md:gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => navigator.clipboard.writeText(msg.text)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
                      title="Copy text"
                      aria-label="Copy text"
                    >
                      <Icons.Copy /> 
                    </button>
                    <button 
                      onClick={() => handleTTS(msg.text)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
                      title="Read aloud"
                      aria-label="Read aloud"
                    >
                      <Icons.Speaker /> 
                    </button>
                    {isLast && !isLoading && (
                      <button 
                        onClick={onRegenerate}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
                        title="Regenerate response"
                        aria-label="Regenerate response"
                      >
                        <Icons.Refresh /> 
                      </button>
                    )}
                  </div>
                </>
              )}
          </div>
          )}
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.msg === next.msg && 
    prev.isEditing === next.isEditing && 
    prev.editInput === next.editInput &&
    prev.isLast === next.isLast &&
    prev.isLoading === next.isLoading
  );
});

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  onSendMessage,
  onMobileMenuToggle,
  onStopGeneration,
  onRegenerate,
  selectedModel,
  onModelChange,
  onOpenSettings,
  onExportChat,
  onEditMessage
}) => {
  const [input, setInput] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editInput, setEditInput] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userScrolledUpRef = useRef(false);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    userScrolledUpRef.current = false;
  }, []);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const distFromBottom = scrollHeight - scrollTop - clientHeight;
      const isNearBottom = distFromBottom < 100;
      
      setShowScrollButton(!isNearBottom);
      userScrolledUpRef.current = !isNearBottom;
    }
  }, []);

  useEffect(() => {
    if (!userScrolledUpRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64String = result.split(',')[1];
          const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
          
          let type: 'image' | 'audio' | 'file' = 'file';
          if (mimeType.startsWith('image/')) type = 'image';
          else if (mimeType.startsWith('audio/')) type = 'audio';

          setSelectedAttachments(prev => [...prev, {
            type,
            mimeType,
            data: base64String,
            name: file.name
          }]);
        };
        reader.readAsDataURL(file as Blob);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleTTS = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleSubmit = useCallback((e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
  }, []);

  const handleFormSubmit = (e?: React.FormEvent, overrideText?: string) => {
     e?.preventDefault();
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && selectedAttachments.length === 0) || isLoading) return;
    
    onSendMessage(textToSend, selectedAttachments);
    if (!overrideText) {
       setInput('');
       setSelectedAttachments([]);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Refocus after send
      setTimeout(() => textareaRef.current?.focus(), 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  const startEditing = useCallback((index: number, text: string) => {
    setEditingMessageIndex(index);
    setEditInput(text);
  }, []);

  const saveEdit = useCallback((index: number) => {
    if (onEditMessage && editInput.trim() !== '') {
      onEditMessage(index, editInput);
      setEditingMessageIndex(null);
      setEditInput('');
    } else {
      setEditingMessageIndex(null);
    }
  }, [editInput, onEditMessage]);

  const currentModelName = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || 'Gemini 3.0';

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-slate-900 relative">
      {/* Header - Sticky */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur z-20 sticky top-0 left-0 right-0 h-16">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMobileMenuToggle} 
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg transition-colors active:scale-95"
            aria-label="Open Menu"
          >
            <Icons.Menu />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors text-sm font-medium border border-transparent hover:border-slate-700"
              aria-label="Select Model"
            >
              <span className="truncate max-w-[120px] md:max-w-none">{currentModelName}</span>
              <Icons.ChevronDown />
            </button>

            {isModelMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden ring-1 ring-black/5">
                  {AVAILABLE_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model.id);
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors flex flex-col gap-0.5
                        ${selectedModel === model.id ? 'bg-slate-700/50' : ''}
                      `}
                    >
                      <span className={`text-sm font-medium ${selectedModel === model.id ? 'text-blue-400' : 'text-slate-200'}`}>
                        {model.name}
                      </span>
                      <span className="text-xs text-slate-500">{model.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
             onClick={onExportChat}
             className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors hidden sm:block"
             title="Export Chat"
             aria-label="Export Chat"
             disabled={messages.length === 0}
          >
            <Icons.Download />
          </button>
          <button 
             onClick={onOpenSettings}
             className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
             title="Session Settings"
             aria-label="Settings"
          >
            <Icons.Settings />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 relative pb-4"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 overflow-y-auto">
             <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
               <div className="flex flex-col items-center mb-8">
                  <div className="w-20 h-20 bg-slate-800/80 rounded-3xl flex items-center justify-center mb-8 text-blue-500 shadow-2xl shadow-blue-900/10 border border-slate-700/50">
                    <Icons.Sparkle />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-200 mb-3">How can I help you today?</h3>
                  <p className="text-slate-500">I can help you code, write, plan, and more.</p>
               </div>
             </div>
           </div>
        ) : (
          <div className="max-w-3xl mx-auto px-3 md:px-4 py-6 space-y-6 md:space-y-8">
            {messages.map((msg, idx) => (
              <MessageItem
                key={idx}
                idx={idx}
                msg={msg}
                isEditing={editingMessageIndex === idx}
                isLoading={isLoading}
                editInput={editInput}
                setEditInput={setEditInput}
                startEditing={startEditing}
                saveEdit={saveEdit}
                setEditingMessageIndex={setEditingMessageIndex}
                onRegenerate={onRegenerate}
                handleSubmit={handleFormSubmit}
                isLast={idx === messages.length - 1}
                handleTTS={handleTTS}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
        
        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-28 md:bottom-32 right-6 z-30 p-3 bg-slate-800 text-slate-200 rounded-full shadow-lg border border-slate-700 hover:bg-slate-700 transition-all animate-in fade-in zoom-in-95 hover:scale-105"
            title="Scroll to bottom"
            aria-label="Scroll to bottom"
          >
            <Icons.ChevronDown />
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-5 bg-slate-900 border-t border-slate-800/80 safe-area-bottom">
        <div className="max-w-3xl mx-auto relative">
          
          {/* File Previews */}
          {selectedAttachments.length > 0 && (
            <div className="flex gap-3 mb-3 overflow-x-auto pb-2 scrollbar-hide">
              {selectedAttachments.map((att, idx) => (
                <div key={idx} className="relative group flex-shrink-0 animate-in fade-in zoom-in-95 duration-200">
                  {att.type === 'image' ? (
                     <img 
                     src={`data:${att.mimeType};base64,${att.data}`} 
                     alt="Preview" 
                     className="w-16 h-16 object-cover rounded-xl border border-slate-700 shadow-md"
                   />
                  ) : (
                    <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center justify-center p-1 shadow-md">
                      <Icons.FileText />
                      <span className="text-[9px] text-slate-400 mt-1 truncate w-full text-center">{att.name}</span>
                    </div>
                  )}
                 
                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-red-400 rounded-full p-1 border border-slate-600 shadow-md z-10 transition-colors"
                    aria-label="Remove attachment"
                  >
                    <Icons.XMark />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-1.5 bg-slate-800/80 border border-slate-700 rounded-2xl p-2 shadow-xl focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
              title="Attach files"
              aria-label="Attach files"
              disabled={isLoading}
            >
              <Icons.PaperClip />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*, audio/*, application/pdf, text/*" 
              multiple 
              onChange={handleFileSelect}
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedAttachments.length > 0 ? "Ask about these files..." : "Message Gemini..."}
              className="w-full bg-transparent text-slate-100 text-base py-3 px-2 focus:outline-none resize-none max-h-[200px] scrollbar-hide placeholder-slate-500"
              rows={1}
            />

            {/* Mic / Stop / Send Buttons */}
            {isLoading ? (
               <button 
               onClick={onStopGeneration}
               className="p-3 mb-0.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex-shrink-0 border border-slate-600"
               title="Stop generating"
               aria-label="Stop generating"
             >
               <Icons.Stop />
             </button>
            ) : (
              <div className="flex items-center mb-0.5">
                 <button 
                  onClick={() => handleFormSubmit()}
                  disabled={!input.trim() && selectedAttachments.length === 0}
                  className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-500 flex-shrink-0 shadow-lg shadow-blue-900/20 active:scale-95 transform"
                  aria-label="Send message"
                >
                  <Icons.Send />
                </button>
              </div>
            )}
          </div>
          <p className="text-center text-[10px] text-slate-500 mt-3 hidden md:block">
            Gemini can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;