import React from 'react';

interface HeroProps {
  onStartChat: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStartChat }) => {
  return (
    <div className="relative overflow-hidden bg-slate-900 pt-16 pb-32 space-y-24">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-500/20 rounded-full blur-3xl opacity-30 mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-[10%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-500/20 rounded-full blur-3xl opacity-30 mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-8 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-ping"></span>
          Now available: Gemini 3.0 Preview
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-indigo-200 to-white mb-6">
          Experience the Future <br /> with Gemini AI
        </h1>
        
        <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Google's most capable and general model, built to be multimodal from the ground up. 
          Unlock new possibilities in reasoning, coding, and creativity.
        </p>
        
        <div className="flex justify-center gap-4">
          <a href="#models" className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-all">
             See Models
          </a>
          <button 
            onClick={onStartChat}
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/25"
          >
            Try Live Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;