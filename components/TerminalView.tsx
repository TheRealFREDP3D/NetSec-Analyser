import React from 'react';
import { Terminal, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface TerminalViewProps {
  content: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ content }) => {
  const lines = content.split('\n');

  const getLineStyle = (line: string) => {
    const lowerLine = line.toLowerCase().trim();
    
    if (!lowerLine) return { bg: '', text: 'text-gray-500' };

    // Comments / Commands
    if (line.trim().startsWith('#') || line.trim().startsWith('$')) {
      return {
        bg: 'bg-gray-800/40',
        text: 'text-gray-400 font-bold',
        icon: <Terminal className="w-3.5 h-3.5" />
      };
    }
    
    // Critical Errors
    if (
      lowerLine.includes('failed') || 
      lowerLine.includes('refused') || 
      lowerLine.includes('error') || 
      lowerLine.includes('denied') ||
      lowerLine.includes('unreachable') ||
      lowerLine.includes('could not')
    ) {
      return {
        bg: 'bg-red-500/10 border-l-2 border-red-500/50 pl-3',
        text: 'text-red-400',
        icon: <AlertCircle className="w-3.5 h-3.5" />
      };
    }

    // Warnings
    if (lowerLine.includes('timeout') || lowerLine.includes('warning') || lowerLine.includes('404')) {
        return {
            bg: 'bg-yellow-500/5 border-l-2 border-yellow-500/50 pl-3',
            text: 'text-yellow-400',
            icon: <AlertTriangle className="w-3.5 h-3.5" />
        }
    }

    // Success
    if (
      lowerLine.includes('succeeded') || 
      lowerLine.includes('connected') ||
      (lowerLine.includes('open') && !lowerLine.includes('could')) ||
      lowerLine.includes('200 ok')
    ) {
      return {
        bg: 'bg-green-500/10 border-l-2 border-green-500/50 pl-3',
        text: 'text-green-400',
        icon: <CheckCircle className="w-3.5 h-3.5" />
      };
    }

    // Default
    return {
      bg: 'hover:bg-gray-800/20 pl-[18px]', // spacing to align with bordered items (2px border + 3px padding + extra) or just padding
      text: 'text-gray-300',
      icon: null
    };
  };

  if (!content) {
    return (
      <div className="bg-[#0d1117] border border-gray-800 rounded-lg overflow-hidden font-mono text-sm h-96 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-800">
           <div className="flex gap-1.5">
             <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30"></div>
             <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30"></div>
           </div>
           <span className="text-gray-600 text-xs font-medium">terminal</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-700">
            Waiting for input...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-lg overflow-hidden font-mono text-sm h-96 flex flex-col shadow-inner">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <span className="text-gray-500 text-xs font-medium">bash — analysis preview</span>
      </div>
      <div className="overflow-auto p-0 flex-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-[#0d1117]">
        {lines.map((line, idx) => {
          const style = getLineStyle(line);
          const hasBorder = style.bg.includes('border-l-2');
          
          return (
            <div key={idx} className={`flex items-start gap-3 py-1 pr-2 ${style.bg} transition-colors min-h-[1.5rem]`}>
              <span className={`text-gray-700 select-none w-8 text-right shrink-0 text-xs pt-0.5 font-mono opacity-50 ${hasBorder ? 'pl-0' : 'pl-0.5'}`}>{idx + 1}</span>
              <div className="flex items-start gap-2 flex-1 min-w-0">
                 {style.icon && <span className="shrink-0 opacity-80 mt-0.5">{style.icon}</span>}
                 <span className={`${style.text} whitespace-pre-wrap break-all leading-tight`}>{line}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};