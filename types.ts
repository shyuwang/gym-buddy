export interface AnalysisResult {
  exerciseName: string;
  score: number;
  summary: string;
  strengths: string[];
  improvements: {
    point: string;
    explanation: string;
    correction: string; // "Let's try..."
    timestamp?: number; // Estimated seconds in video
  }[];
  tips: string[];
  muscleGroups: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface HistoryItem {
  id: string;
  date: string;
  thumbnail?: string;
  analysis: AnalysisResult;
}

export enum AppView {
  HOME = 'HOME',
  ANALYSIS = 'ANALYSIS',
  HISTORY = 'HISTORY',
  LIBRARY = 'LIBRARY'
}
