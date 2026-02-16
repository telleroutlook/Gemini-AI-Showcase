import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 py-12 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
             <h4 className="text-white text-lg font-bold mb-4">Gemini AI Showcase</h4>
             <p className="max-w-xs">Exploring the frontiers of multimodal AI with the Gemini family of models. Built by Google DeepMind.</p>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3">Models</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Gemini 3.0 Pro</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Gemini 3.0 Flash</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Gemini 2.5 Flash</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Veo & Imagen</a></li>
            </ul>
          </div>
          <div>
             <h5 className="text-white font-semibold mb-3">Resources</h5>
             <ul className="space-y-2">
              <li><a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Google AI Studio</a></li>
              <li><a href="https://deepmind.google/technologies/gemini/" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">DeepMind Blog</a></li>
              <li><a href="https://ai.google.dev/docs" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Documentation</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-800 text-center">
          <p>&copy; {new Date().getFullYear()} Gemini AI Showcase. Demo purposes only.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
