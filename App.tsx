import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, FileText, ChevronRight, Shield, Globe, Lock, Download, Upload } from 'lucide-react';
import { TerminalView } from './components/TerminalView';
import { AnalysisPanel } from './components/AnalysisPanel';
import { analyzeLog } from './services/geminiService';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [logContent, setLogContent] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'analysis'>('input');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setActiveTab('analysis');
    try {
      const result = await analyzeLog(logContent);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze log');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogContent('');
    setAnalysis(null);
    setActiveTab('input');
  };

  const handleSaveSession = () => {
    const sessionData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      logContent,
      analysis
    };
    
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netsec-session-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const session = JSON.parse(content);
        
        if (session.logContent !== undefined) setLogContent(session.logContent);
        if (session.analysis !== undefined) {
          setAnalysis(session.analysis);
          if (session.analysis) {
            setActiveTab('analysis');
          } else {
            setActiveTab('input');
          }
        }
      } catch (err) {
        setError('Invalid session file format');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input so the same file can be selected again
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#161b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent-blue/10 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-accent-blue" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight">NetSec <span className="text-accent-blue">Analyzer</span></h1>
              <p className="text-xs text-gray-500 font-mono">CTF & RECON TOOLKIT</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <Activity className="w-4 h-4 text-accent-green" />
              <span>System Operational</span>
            </div>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 pb-32">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 shadow-sm">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                Context
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="text-gray-500">Mode</span>
                  <span className="font-mono text-accent-green">RECON</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Parser</span>
                  <span className="font-mono text-gray-300">GEMINI-2.5</span>
                </div>
              </div>
            </div>

            {/* Session Management */}
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 shadow-sm">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-blue" />
                Session
              </h2>
              <div className="space-y-3">
                <button 
                  onClick={handleSaveSession}
                  disabled={!logContent && !analysis}
                  className="w-full flex items-center gap-3 px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-lg transition-colors text-sm border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Download className="w-4 h-4 group-hover:text-accent-blue transition-colors" />
                  Save to File
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-lg transition-colors text-sm border border-gray-700 group"
                >
                  <Upload className="w-4 h-4 group-hover:text-accent-green transition-colors" />
                  Load from File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleLoadSession}
                  className="hidden"
                  accept=".json"
                />
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#161b22] p-1 rounded-lg w-fit border border-gray-800">
              <button
                onClick={() => setActiveTab('input')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'input' 
                    ? 'bg-gray-800 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Raw Input
              </button>
              <button
                onClick={() => { if(analysis) setActiveTab('analysis'); }}
                disabled={!analysis}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'analysis' 
                    ? 'bg-gray-800 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <Activity className="w-4 h-4" />
                Intelligence Report
              </button>
            </div>

            {/* Content Views */}
            <div className="flex-1 min-h-[500px]">
              {activeTab === 'input' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/10 to-purple-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Terminal Output / Log File
                        </label>
                        <span className="text-xs text-gray-600 font-mono">Paste your logs below</span>
                      </div>
                      <textarea
                        value={logContent}
                        onChange={(e) => setLogContent(e.target.value)}
                        className="w-full h-[400px] bg-[#0d1117] border border-gray-700 focus:border-accent-blue rounded-xl p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-accent-blue transition-all scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
                        placeholder="Paste network logs here (nmap, curl, dig, etc)..."
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-400" />
                      Syntax Highlighting Preview
                    </h3>
                    <TerminalView content={logContent} />
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <AnalysisPanel 
                  result={analysis} 
                  loading={loading} 
                  error={error} 
                />
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Actions Footer */}
      <div className="border-t border-gray-800 bg-[#161b22] p-4 sticky bottom-0 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-end gap-4">
           <button
             onClick={clearLogs}
             className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 px-6 rounded-lg transition-all border border-gray-700"
           >
             Clear Session
           </button>
           <button
             onClick={handleAnalyze}
             disabled={loading || !logContent}
             className="bg-accent-blue hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,191,255,0.2)]"
           >
             {loading ? 'Processing...' : 'Analyze Log'}
             {!loading && <ChevronRight className="w-4 h-4" />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default App;