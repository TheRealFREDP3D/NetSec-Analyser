export enum LogStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  WARNING = 'WARNING',
  INFO = 'INFO'
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
