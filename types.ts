export enum LogStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

export enum LLMProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  OLLAMA = 'ollama'
}

export interface ParsedLogEntry {
  id: string;
  tool: string;
  target?: string;
  status: LogStatus;
  message: string;
  timestamp: string;
}

export interface AnalysisResult {
  summary: string;
  keyFindings: string[];
  securityPosture: string;
  recommendations: string[];
}

export interface HistoryEntry {
  id: string;
  title: string;
  timestamp: string;
  logContent: string;
  analysis: AnalysisResult;
  modelUsed: LLMModel;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
}

export const AVAILABLE_MODELS: LLMModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: LLMProvider.GEMINI },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: LLMProvider.GEMINI },
  { id: 'gpt-4o', name: 'GPT-4o', provider: LLMProvider.OPENAI },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: LLMProvider.OPENAI },
  { id: 'llama3.2', name: 'Llama 3.2', provider: LLMProvider.OLLAMA },
  { id: 'llama3.1', name: 'Llama 3.1', provider: LLMProvider.OLLAMA },
  { id: 'qwen2.5', name: 'Qwen 2.5', provider: LLMProvider.OLLAMA },
  { id: 'mistral', name: 'Mistral', provider: LLMProvider.OLLAMA },
  { id: 'codellama', name: 'Code Llama', provider: LLMProvider.OLLAMA },
];
