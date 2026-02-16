import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid settings
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
  });
} catch (e) {
  // Prevent crash if initialized multiple times
}

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    // Clear previous timeout to debounce rendering
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce rendering to avoid parsing every character during streaming
    // and to reduce flickering between valid/invalid states
    timeoutRef.current = setTimeout(async () => {
      try {
        // Create a unique ID for the diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        // mermaid.render throws if syntax is invalid (e.g. incomplete stream)
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        
        setSvg(renderedSvg);
        setHasError(false);
      } catch (err) {
        // If syntax is invalid (common during streaming), we set error state
        // This will trigger the fallback to code view
        setHasError(true);
      }
    }, 200);

    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [chart]);

  // Fallback view: When syntax is invalid (streaming) or rendering failed
  if (hasError || !svg) {
    return (
      <div className="relative group rounded-md bg-slate-900 border border-slate-700 my-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
           <span className="text-xs text-slate-400 font-mono">Mermaid</span>
           <span className="text-[10px] text-slate-500 uppercase tracking-wider animate-pulse">
             {hasError ? 'Generating Diagram...' : 'Rendering...'}
           </span>
        </div>
        <pre className="p-4 overflow-x-auto text-sm text-slate-300 font-mono whitespace-pre scrollbar-thin scrollbar-thumb-slate-700">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-6 flex justify-center bg-slate-900/30 rounded-lg p-4 border border-slate-800/50 overflow-x-auto">
        <div 
            className="mermaid-diagram"
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
    </div>
  );
};

export default Mermaid;