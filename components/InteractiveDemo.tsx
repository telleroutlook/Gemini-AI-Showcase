import React, { useState, useRef, useEffect } from 'react';
import { createChatSession, sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Icons as IconComponents } from '../constants';
import { Chat } from '@google/genai';
import MarkdownRenderer from './MarkdownRenderer';

const InteractiveDemo: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: 'Hello! I am powered by Gemini 3.0 Flash. I can write code, create tables, and even draw diagrams using Mermaid syntax.\n\nTry asking me to:\n- "Draw a flowchart of a login process"\n- "Compare React vs Vue in a table"\n- "Write a python script to sort a list"', 
      timestamp: Date.now() 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use a ref to maintain the chat session across renders
  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    // Initialize chat session on mount
    try {
      chatSessionRef.current = createChatSession();
    } catch (e) {
      console.error("Failed to initialize chat session:", e);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: prompt, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setIsLoading(true);

    try {
      // Ensure session exists
      if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession();
      }

      const responseText = await sendChatMessage(chatSessionRef.current, userMsg.text);
      const modelMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = { role: 'model', text: "Sorry, I encountered an error. Please check your API key configuration.", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="demo" className="py-24 bg-slate-900 relative">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10">
          <span className="text-blue-400 font-semibold tracking-wide uppercase text-sm">Experience It Live</span>
          <h2 className="text-3xl font-bold text-white mt-2">Interactive Demo</h2>
          <p className="text-slate-400 mt-2">Test the speed and reasoning of Gemini 3.0 Flash Preview.</p>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
          {/* Chat Window */}
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-700/50 text-slate-100 rounded-bl-none border border-slate-600'
                }`}>
                   {msg.role === 'user' ? (
                     <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                   ) : (
                     <MarkdownRenderer content={msg.text} />
                   )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700/50 rounded-2xl rounded-bl-none px-5 py-4 border border-slate-600 flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-800/80 border-t border-slate-700">
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Gemini to write code or draw a diagram..."
                className="w-full bg-slate-900 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !prompt.trim()}
                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconComponents.Sparkle />
              </button>
            </form>
            <p className="text-center text-xs text-slate-500 mt-2">
              Gemini may display inaccurate info, including about people, so double-check its responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDemo;