import React, { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import Mermaid from './Mermaid';
import { Icons } from '../constants';

interface MarkdownRendererProps {
  content: string;
}

// Helper to extract raw text from React children
const extractText = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) {
    return extractText(node.props.children);
  }
  return '';
};

// Memoize small interactive components
const CopyButton: React.FC<{ text: string }> = React.memo(({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-md transition-all"
      title="Copy code"
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? <Icons.Check /> : <Icons.Copy />}
    </button>
  );
});

const DownloadButton: React.FC<{ text: string, language: string }> = React.memo(({ text, language }) => {
  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const extensions: {[key: string]: string} = {
      javascript: 'js', typescript: 'ts', python: 'py', html: 'html', css: 'css',
      json: 'json', markdown: 'md', java: 'java', cpp: 'cpp', c: 'c', go: 'go',
      rust: 'rs', php: 'php', ruby: 'rb', swift: 'swift', kotlin: 'kt', sql: 'sql',
      shell: 'sh', bash: 'sh', xml: 'xml', yaml: 'yaml',
    };

    const ext = extensions[language.toLowerCase()] || 'txt';
    a.download = `code_snippet.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-md transition-all"
      title="Download file"
      aria-label="Download code"
    >
      <Icons.Download />
    </button>
  );
});

const CodeBlockWithPreview: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const rawCode = extractText(children).replace(/\n$/, '');
  
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const canPreview = language === 'html' || language === 'svg';

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 lowercase font-mono">{language || 'code'}</span>
          {canPreview && (
            <div className="flex bg-slate-900 rounded-md p-0.5 border border-slate-700">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeTab === 'code' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="View Code"
              >
                <Icons.Code /> Code
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeTab === 'preview' ? 'bg-blue-600/80 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="View Preview"
              >
                <Icons.Eye /> Preview
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
           <DownloadButton text={rawCode} language={language} />
           <CopyButton text={rawCode} />
        </div>
      </div>

      {activeTab === 'preview' && canPreview ? (
        <div className="bg-white overflow-hidden h-[500px] resize-y relative rounded-b-lg">
           <iframe 
             srcDoc={rawCode}
             className="w-full h-full border-0"
             sandbox="allow-scripts"
             title="Code Preview"
           />
        </div>
      ) : (
        <code className={`!bg-slate-950 !p-4 block overflow-x-auto ${className}`}>
           {children}
        </code>
      )}
    </div>
  );
};

// Define plugins outside component to maintain stable references
const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [rehypeHighlight, rehypeKatex];

const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content }) => {
  return (
    <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed">
      <Markdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        skipHtml={true} // Security optimization
        components={{
          code(props) {
            const {children, className, ...rest} = props;
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (language === 'mermaid') {
              return <Mermaid chart={extractText(children).replace(/\n$/, '')} />;
            }
            
            const rawText = extractText(children);
            const isBlock = match || rawText.includes('\n');
            
            if (isBlock) {
               return <CodeBlockWithPreview className={className}>{children}</CodeBlockWithPreview>;
            }

            return (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300 transition-all cursor-pointer"
            />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc list-outside ml-4 my-2 space-y-1" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal list-outside ml-4 my-2 space-y-1" />
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="pl-1" />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 border border-slate-700 rounded-lg shadow-sm bg-slate-800/20">
              <table {...props} className="min-w-full divide-y divide-slate-700 m-0" />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead {...props} className="bg-slate-800/80" />
          ),
          th: ({ node, ...props }) => (
            <th {...props} className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider whitespace-nowrap" />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap border-t border-slate-700/50" />
          ),
          blockquote: ({ node, ...props }) => (
             <blockquote {...props} className="border-l-4 border-blue-500/50 pl-4 py-1 italic text-slate-400 bg-slate-800/30 rounded-r-md my-4" />
          )
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}, (prevProps, nextProps) => {
    return prevProps.content === nextProps.content;
});

export default MarkdownRenderer;