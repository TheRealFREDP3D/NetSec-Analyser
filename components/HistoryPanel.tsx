import React from 'react';
import { HistoryEntry } from '../types';
import { Clock, FileText, Trash2, Eye } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  selectedEntryId?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  history, 
  onSelectEntry, 
  onDeleteEntry, 
  selectedEntryId 
}) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
        <Clock className="w-12 h-12 mb-4 opacity-50" />
        <p>No analysis history yet</p>
        <p className="text-sm mt-2">Complete your first analysis to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-blue" />
          Analysis History
        </h3>
        <span className="text-sm text-gray-500">{history.length} entries</span>
      </div>

      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={entry.id}
            className={`group relative bg-gray-900 border rounded-lg p-4 transition-all cursor-pointer hover:border-accent-blue/50 hover:shadow-lg ${
              selectedEntryId === entry.id 
                ? 'border-accent-blue bg-accent-blue/5' 
                : 'border-gray-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div 
                className="flex-1 min-w-0"
                onClick={() => onSelectEntry(entry)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-accent-blue shrink-0" />
                  <h4 className="font-medium text-white truncate pr-2">
                    {entry.title}
                  </h4>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span>{formatDate(entry.timestamp)}</span>
                  <span>•</span>
                  <span>{entry.modelUsed.name}</span>
                </div>

                <p className="text-sm text-gray-400 line-clamp-2">
                  {entry.analysis.summary}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs bg-accent-red/20 text-accent-red px-2 py-1 rounded">
                    {entry.analysis.keyFindings.length} findings
                  </span>
                  <span className="text-xs bg-accent-green/20 text-accent-green px-2 py-1 rounded">
                    {entry.analysis.recommendations.length} recommendations
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntry(entry);
                  }}
                  className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                  title="View analysis"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this analysis from history?')) {
                      onDeleteEntry(entry.id);
                    }
                  }}
                  className="p-1.5 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {selectedEntryId === entry.id && (
              <div className="absolute inset-0 border-2 border-accent-blue rounded-lg pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
