import React from 'react';
import { Icons, PROMPT_LIBRARY_CATEGORIES } from '../constants';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({ isOpen, onClose, onSelectPrompt }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Icons.Book />
            Prompt Library
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Icons.XMark />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(PROMPT_LIBRARY_CATEGORIES).map(([category, prompts]) => (
              <div key={category} className="space-y-4">
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider sticky top-0 bg-slate-800/95 py-2 z-10">
                  {category}
                </h4>
                <div className="space-y-3">
                  {prompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectPrompt(item.prompt);
                        onClose();
                      }}
                      className="w-full text-left p-4 rounded-xl bg-slate-700/30 border border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 transition-all group"
                    >
                      <h5 className="font-medium text-slate-200 mb-1 group-hover:text-blue-300">{item.title}</h5>
                      <p className="text-xs text-slate-500 line-clamp-3">{item.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptLibraryModal;