import React from 'react';
import { MODELS } from '../constants';
import ModelCard from './ModelCard';

const ModelShowcase: React.FC = () => {
  const v3Models = MODELS.filter(m => m.version === '3.0');
  const v25Models = MODELS.filter(m => m.version === '2.5');
  const specialModels = MODELS.filter(m => m.version === 'Specialized');

  return (
    <div id="models" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">The Gemini Family</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            From efficient devices to powerful data centers, there's a Gemini model for every task.
          </p>
        </div>

        {/* 3.0 Series */}
        <div className="mb-16">
           <div className="flex items-center gap-4 mb-8">
             <h3 className="text-2xl font-bold text-white">Gemini 3.0 Series</h3>
             <div className="h-px bg-slate-700 flex-grow"></div>
             <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Next Gen</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {v3Models.map(model => <ModelCard key={model.id} model={model} />)}
           </div>
        </div>

        {/* 2.5 Series */}
         <div className="mb-16">
           <div className="flex items-center gap-4 mb-8">
             <h3 className="text-2xl font-bold text-white">Gemini 2.5 Series</h3>
             <div className="h-px bg-slate-700 flex-grow"></div>
             <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Production Ready</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {v25Models.map(model => <ModelCard key={model.id} model={model} />)}
           </div>
        </div>

        {/* Specialized */}
         <div>
           <div className="flex items-center gap-4 mb-8">
             <h3 className="text-2xl font-bold text-white">Specialized Models</h3>
             <div className="h-px bg-slate-700 flex-grow"></div>
             <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">Creative & Media</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {specialModels.map(model => <ModelCard key={model.id} model={model} />)}
           </div>
        </div>

      </div>
    </div>
  );
};

export default ModelShowcase;
