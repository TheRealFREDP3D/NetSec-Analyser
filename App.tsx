import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, FileText, Shield, Lock, Download, Upload, Settings, ChevronRight } from 'lucide-react';
import { TerminalView } from './components/TerminalView';
import { AnalysisPanel } from './components/AnalysisPanel';
import { analyzeLog, fetchGeminiModels, fetchOllamaModels, fetchOpenAIModels } from './services/llmService';
import { AnalysisResult, LLMModel, LLMProvider, AVAILABLE_MODELS } from './types';

const App: React.FC = () => {
  const [logContent, setLogContent] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'analysis'>('input');
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [highlightingEnabled, setHighlightingEnabled] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available models on component mount
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadModels = async () => {
      try {
        setModelsLoading(true);
        
        // Fetch models from Gemini, OpenAI, and Ollama in parallel
        const [geminiModels, openaiModels, ollamaModels] = await Promise.allSettled([
          fetchGeminiModels(),
          fetchOpenAIModels(),
          fetchOllamaModels()
        ]);

        const gemini = geminiModels.status === 'fulfilled' ? geminiModels.value : [];
        const openai = openaiModels.status === 'fulfilled' ? openaiModels.value : [];
        const ollama = ollamaModels.status === 'fulfilled' ? ollamaModels.value : [];

        // Check if component is still mounted before updating state
        if (!abortController.signal.aborted) {
          // Combine fetched models (including fallbacks when API calls fail)
          // No need to filter static models since the service functions return fallback models when API calls fail
          const allModels = [...gemini, ...openai, ...ollama];

          setAvailableModels(allModels);

          // Set default selected model only if none is already selected (prefer Gemini, fallback to OpenAI, then Ollama, then first available)
          const defaultGeminiModel = gemini[0];
          const defaultOpenAIModel = openai[0];
          const defaultOllamaModel = ollama[0];
          const firstAvailableModel = allModels[0];
          
          setSelectedModel(prev => {
            if (prev) return prev; // Keep existing selection
            
            if (defaultGeminiModel) return defaultGeminiModel;
            if (defaultOpenAIModel) return defaultOpenAIModel;
            if (defaultOllamaModel) return defaultOllamaModel;
            return firstAvailableModel;
          });
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError('Failed to load available models');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setModelsLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      abortController.abort();
    };
  }, []);

  const handleAnalyze = async () => {
    if (!selectedModel) {
      setError('Please select an AI model before analyzing');
      return;
    }

    if (!logContent.trim()) {
      setError('Please provide log content to analyze');
      return;
    }

    // Validate log content size (max 100KB to prevent excessive API usage)
    const maxLogSize = 100 * 1024; // 100KB
    if (logContent.length > maxLogSize) {
      setError(`Log content too large (${Math.round(logContent.length / 1024)}KB). Maximum allowed size is 100KB. Please reduce the log content.`);
      return;
    }

    // Validate minimum content length (at least 10 characters after trimming)
    if (logContent.trim().length < 10) {
      setError('Log content too short. Please provide more substantial log data for analysis.');
      return;
    }

    setLoading(true);
    setError(null);
    setActiveTab('analysis');
    try {
      const result = await analyzeLog(logContent, selectedModel);
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
      analysis,
      selectedModel
    };
    
    let url: string | null = null;
    try {
      const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `netsec-session-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to save session:', error);
      setError('Failed to save session file');
    } finally {
      // Always cleanup the object URL to prevent memory leaks
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
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
        if (session.selectedModel) {
          // First check in available models (dynamic + static), then fallback to static models only
          let model = availableModels.find(m => m.id === session.selectedModel.id);
          if (!model) {
            model = AVAILABLE_MODELS.find(m => m.id === session.selectedModel.id);
          }
          if (model) setSelectedModel(model);
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
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top Row - Title and Status */}
          <div className="flex items-center justify-between mb-3">
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

          {/* Bottom Row - AI Model and Session Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LLM Provider Selection */}
            <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-orange-400" />
                <h3 className="text-white font-medium text-sm">AI Model</h3>
                {modelsLoading && (
                  <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin ml-auto"></div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {Object.values(LLMProvider).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => {
                      const firstModel = availableModels.find(m => m.provider === provider);
                      if (firstModel) {
                        setSelectedModel(firstModel);
                      } else {
                        // Clear selected model if no models available for this provider
                        setSelectedModel(null);
                      }
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                      selectedModel?.provider === provider
                        ? 'bg-accent-blue text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </button>
                ))}
              </div>
              <select
                value={selectedModel?.id || ''}
                onChange={(e) => {
                  const model = availableModels.find(m => m.id === e.target.value);
                  if (model) setSelectedModel(model);
                }}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue"
              >
                <option value="">Select a model...</option>
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* Session Management */}
            <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-accent-blue" />
                <h3 className="text-white font-medium text-sm">Session</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveSession}
                  disabled={!logContent && !analysis}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded transition-colors text-sm border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Download className="w-3 h-3 group-hover:text-accent-blue transition-colors" />
                  Save
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded transition-colors text-sm border border-gray-700 group"
                >
                  <Upload className="w-3 h-3 group-hover:text-accent-green transition-colors" />
                  Load
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 pb-32">
        <div className="flex flex-col gap-6">
          
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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setHighlightingEnabled(!highlightingEnabled)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                            highlightingEnabled 
                              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' 
                              : 'bg-gray-800 text-gray-500 border border-gray-700'
                          }`}
                        >
                          {highlightingEnabled ? (
                            <>
                              <Lock className="w-3 h-3" />
                              Highlighting ON
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              Highlighting OFF
                            </>
                          )}
                        </button>
                        <span className="text-xs text-gray-600 font-mono">Paste your logs below</span>
                      </div>
                    </div>
                    {highlightingEnabled ? (
                      <div className="bg-[#0d1117] border border-gray-700 rounded-xl overflow-hidden">
                        <TerminalView content={logContent} />
                      </div>
                    ) : (
                      <textarea
                        value={logContent}
                        onChange={(e) => setLogContent(e.target.value)}
                        className="w-full h-[400px] bg-[#0d1117] border border-gray-700 focus:border-accent-blue rounded-xl p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-accent-blue transition-all scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
                        placeholder="Paste network logs here (nmap, curl, dig, etc)..."
                        spellCheck={false}
                      />
                    )}
                  </div>
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
             disabled={loading || !logContent || !selectedModel || modelsLoading}
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