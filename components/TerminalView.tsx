import React from 'react';

interface TerminalViewProps {
  content: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto h-96 overflow-y-auto">
      {lines.map((line, idx) => {
        let className = "text-gray-300";
        if (line.startsWith('#')) className = "text-gray-500 font-bold";
        else if (line.includes('failed') || line.includes('refused') || line.includes('Error') || line.includes('not found')) className = "text-accent-red";
        else if (line.includes('succeeded') || line.includes('Connected')) className = "text-accent-green";
        
        return (
          <div key={idx} className={`${className} whitespace-pre`}>
            <span className="text-gray-700 select-none mr-4">{idx + 1}</span>
            {line}
          </div>
        );
      })}
    </div>
  );
};