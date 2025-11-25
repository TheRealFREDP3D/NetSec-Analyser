import React from 'react';
import { AnalysisResult } from '../types';
import { ShieldAlert, CheckCircle, Search, Info } from 'lucide-react';

interface AnalysisPanelProps {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ result, loading, error }) => {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 p-12 text-gray-400">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">Deciphering network traffic...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 text-red-200 p-6 rounded-lg flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 shrink-0" />
        <div>
          <h3 className="font-bold text-lg">Analysis Failed</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
        <Search className="w-12 h-12 mb-4 opacity-50" />
        <p>Paste a log and click "Analyze" to initialize the neural engine.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Summary Card */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-4 text-accent-blue">
            <Info className="w-5 h-5" />
            <h3 className="font-bold text-lg">Executive Summary</h3>
          </div>
          <p className="text-gray-300 leading-relaxed">{result.summary}</p>
        </div>

        {/* Security Posture */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-4 text-purple-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-lg">Target Posture</h3>
          </div>
          <p className="text-gray-300 leading-relaxed">{result.securityPosture}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Findings */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="font-bold text-lg text-accent-red mb-4 border-b border-gray-800 pb-2">Critical Findings</h3>
          <ul className="space-y-3">
            {result.keyFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-300">
                <span className="text-accent-red mt-1">✖</span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="font-bold text-lg text-accent-green mb-4 border-b border-gray-800 pb-2">Tactical Recommendations</h3>
          <ul className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-300">
                <CheckCircle className="w-4 h-4 text-accent-green mt-1 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};