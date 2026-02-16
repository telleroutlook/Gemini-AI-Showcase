import React from 'react';
import { ModelInfo } from '../types';

interface ModelCardProps {
  model: ModelInfo;
}

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  return (
    <div className="group relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-900 rounded-lg text-blue-400 border border-slate-700 shadow-sm">
          {model.icon}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
          model.badge === 'Preview' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 
          model.badge === 'Stable' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
          'bg-purple-500/10 text-purple-300 border-purple-500/20'
        }`}>
          {model.badge}
        </span>
      </div>

      <div className="relative z-10 mb-4 flex-grow">
        <h3 className="text-xl font-bold text-slate-100 mb-2">{model.name}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{model.description}</p>
      </div>

      <div className="relative z-10 border-t border-slate-700/50 pt-4 mt-auto">
        <div className="flex flex-wrap gap-2 mb-3">
          {model.capabilities.slice(0, 3).map((cap, i) => (
             <span key={i} className="text-xs text-slate-300 bg-slate-700/50 px-2 py-1 rounded">
               {cap}
             </span>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          <strong className="text-slate-400">Best for:</strong> {model.bestFor}
        </p>
      </div>
    </div>
  );
};

export default ModelCard;
