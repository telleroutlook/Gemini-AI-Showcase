import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { SessionConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SessionConfig;
  onSave: (config: SessionConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [systemInstruction, setSystemInstruction] = useState(config.systemInstruction || '');
  const [temperature, setTemperature] = useState(config.temperature ?? 1.0);
  const [maxOutputTokens, setMaxOutputTokens] = useState<number | undefined>(config.maxOutputTokens);
  const [thinkingBudget, setThinkingBudget] = useState<number | undefined>(config.thinkingBudget);
  const [useSearch, setUseSearch] = useState<boolean>(config.useSearch ?? true);

  // Sync state when config prop changes
  useEffect(() => {
    if (isOpen) {
      setSystemInstruction(config.systemInstruction || '');
      setTemperature(config.temperature ?? 1.0);
      setMaxOutputTokens(config.maxOutputTokens);
      setThinkingBudget(config.thinkingBudget);
      setUseSearch(config.useSearch ?? true);
    }
  }, [isOpen, config]);

  const handleSave = () => {
    onSave({
      systemInstruction,
      temperature,
      maxOutputTokens,
      thinkingBudget,
      useSearch
    });
    onClose();
  };

  const applyPreset = (temp: number, instruction: string, tokens?: number, thinking?: number) => {
    setTemperature(temp);
    setSystemInstruction(instruction);
    if (tokens) setMaxOutputTokens(tokens);
    if (thinking !== undefined) setThinkingBudget(thinking);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal - Bottom sheet on mobile, center modal on desktop */}
      <div className="relative bg-slate-900 md:bg-slate-800 border-t md:border border-slate-700 rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        
        {/* Mobile Handle */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
        </div>

        <div className="flex items-center justify-between p-4 border-b border-slate-800 md:border-slate-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Icons.Sliders />
            Session Settings
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Icons.XMark />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 pb-20 md:pb-6">
          {/* Tools Section */}
          <div className="space-y-4">
             <label className="block text-sm font-medium text-slate-300">
               Tools
             </label>
             <div className="flex items-center justify-between p-3 bg-slate-950 md:bg-slate-900 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                      <Icons.Globe />
                   </div>
                   <div>
                      <div className="text-sm font-medium text-slate-200">Google Search</div>
                      <div className="text-xs text-slate-500">Connect to real-time information</div>
                   </div>
                </div>
                <button
                  onClick={() => setUseSearch(!useSearch)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    useSearch ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useSearch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
             </div>
          </div>

          <div className="h-px bg-slate-800 md:bg-slate-700/50 my-2"></div>

          {/* Presets */}
          <div className="space-y-2">
             <label className="block text-sm font-medium text-slate-300">
               Quick Presets
             </label>
             <div className="flex flex-wrap gap-2">
               <button 
                 onClick={() => applyPreset(0.2, "You are an expert software engineer. Provide clean, efficient, and well-documented code.", 8192, 0)}
                 className="px-3 py-2 text-xs bg-slate-800 md:bg-slate-700 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors active:scale-95"
               >
                 👨‍💻 Coding
               </button>
               <button 
                 onClick={() => applyPreset(1.2, "You are a creative writer. Use vivid imagery and engaging storytelling.", undefined, 0)}
                 className="px-3 py-2 text-xs bg-slate-800 md:bg-slate-700 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors active:scale-95"
               >
                 ✍️ Creative
               </button>
               <button 
                 onClick={() => applyPreset(0.5, "You are a precise data analyst. Be objective and factual.", undefined, 1024)}
                 className="px-3 py-2 text-xs bg-slate-800 md:bg-slate-700 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors active:scale-95"
               >
                 🧠 Reasoning
               </button>
             </div>
          </div>

          {/* System Instruction */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              System Instruction
            </label>
            <p className="text-xs text-slate-500">
              Define the AI's persona, role, or constraints.
            </p>
            <textarea
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="e.g. You are a senior React developer. Be concise."
              className="w-full h-32 md:h-24 bg-slate-950 md:bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
            />
          </div>

          {/* Temperature */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-300">
                Temperature
              </label>
              <span className="text-xs font-mono bg-slate-800 md:bg-slate-700 px-2 py-0.5 rounded text-blue-300">
                {temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-4 bg-slate-800 md:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-none"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          <div className="h-px bg-slate-800 md:bg-slate-700/50 my-4"></div>

          {/* Advanced Settings */}
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
             Advanced <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Gemini 3.0/2.5</span>
          </h4>

          {/* Max Output Tokens */}
           <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-300">
                Max Output Tokens
              </label>
              <span className="text-xs font-mono bg-slate-800 md:bg-slate-700 px-2 py-0.5 rounded text-blue-300">
                {maxOutputTokens || 'Default'}
              </span>
            </div>
            <input
              type="range"
              min="1024"
              max="32768"
              step="1024"
              value={maxOutputTokens || 8192}
              onChange={(e) => setMaxOutputTokens(parseInt(e.target.value))}
              className="w-full h-4 bg-slate-800 md:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 touch-none"
            />
            <p className="text-xs text-slate-500">Controls the maximum length of the generated response.</p>
          </div>

          {/* Thinking Budget */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-300">
                Thinking Budget
              </label>
              <span className="text-xs font-mono bg-slate-800 md:bg-slate-700 px-2 py-0.5 rounded text-blue-300">
                {thinkingBudget ? `${thinkingBudget} tokens` : 'Disabled'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="8192"
              step="512"
              value={thinkingBudget || 0}
              onChange={(e) => setThinkingBudget(parseInt(e.target.value) || undefined)}
              className="w-full h-4 bg-slate-800 md:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 touch-none"
            />
            <p className="text-xs text-slate-500">
              Tokens reserved for internal reasoning. Requires Max Output Tokens to be set higher than this budget.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 md:border-slate-700 flex justify-end gap-3 safe-area-bottom">
          <button
            onClick={onClose}
            className="px-4 py-3 md:py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none px-6 py-3 md:py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl md:rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;