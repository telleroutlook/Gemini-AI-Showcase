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
  const [isRendering, setIsRendering] = useState(false);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    // Clear previous timeout to debounce rendering
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsRendering(true);

    // Debounce rendering to avoid parsing every character during streaming
    timeoutRef.current = setTimeout(async () => {
      try {
        // Quick validation: Don't render if chart is too short or clearly incomplete
        if (chart.length < 10) throw new Error("Chart too short");

        // Create a unique ID for the diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        // mermaid.render throws if syntax is invalid (e.g. incomplete stream)
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        
        setSvg(renderedSvg);
        setHasError(false);
      } catch (err) {
        // Syntax invalid (common during streaming)
        setHasError(true);
      } finally {
        setIsRendering(false);
      }
    }, 400); // Increased debounce slightly for smoother streaming experience

    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [chart]);

  // Fallback view: When syntax is invalid (streaming) or rendering failed
  // We only show the fallback if we don't have a valid SVG yet OR if we have an error and we are not rendering (stable error)
  if (hasError && !svg) {
    return (
      <div className="relative group rounded-md bg-slate-900 border border-slate-700 my-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
           <span className="text-xs text-slate-400 font-mono">Mermaid</span>
           <span className="text-[10px] text-slate-500 uppercase tracking-wider animate-pulse">
             {isRendering ? 'Processing...' : 'Generating Diagram...'}
           </span>
        </div>
        <pre className="p-4 overflow-x-auto text-sm text-slate-300 font-mono whitespace-pre scrollbar-thin scrollbar-thumb-slate-700 opacity-70">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-6 relative">
       <div className={`flex justify-center bg-slate-900/30 rounded-lg p-4 border border-slate-800/50 overflow-x-auto ${isRendering ? 'opacity-80' : 'opacity-100'} transition-opacity`}>
          <div 
              className="mermaid-diagram"
              dangerouslySetInnerHTML={{ __html: svg }} 
          />
      </div>
      {/* Subtle loading indicator overlaid if re-rendering */}
      {isRendering && svg && (
        <div className="absolute top-2 right-2">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
        </div>
      )}
    </div>
  );
};

export default Mermaid;