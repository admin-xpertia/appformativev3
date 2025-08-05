// En packages/types/src/interfaces.ts
import { CaseSlug, CompetencySlug, CompetencyLevel } from "./enums";

export interface ICase {
  [key: string]: any;
  id: string;
  slug: CaseSlug;
  title: string;
  currentLevel?: CompetencyLevel;
  attempts?: string;
  progress?: number;
  available?: boolean;
  lastAttempt?: string;
  status?: 'in_progress' | 'pending';
}

export interface ILevel {
  [key: string]: any;
  id: string;
  case: string;
  caseTitle: string;
  level: CompetencyLevel;
  objectives: string;
}

export interface ICompetencyProgress {
  [key: string]: any;
  competency: CompetencySlug;
  progress: number;
  level: CompetencyLevel;
}

export interface ISimulationSession {
  [key: string]: any;
  id: string;
  userId: string;
  case: CaseSlug;
  level: CompetencyLevel;
  attemptNumber: number;
  startTime: Date;
  endTime?: Date;
  conversationHistory: IConversationMessage[];
  finalFeedback?: IFeedbackReport;
  passed: boolean;
}

export interface IConversationMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// ✅ INTERFAZ UNIFICADA - Solo una definición
export interface ICompetencyFeedback {
  competency: CompetencySlug;
  achievedLevel: CompetencyLevel;
  strengths: string[];
  areasForImprovement: string[];
  justification: string;
  meetsIndicators?: boolean; // ✅ Campo opcional añadido
}

export interface IFeedbackReport {
  generalCommentary: string;
  competencyFeedback: ICompetencyFeedback[];
  recommendations: string[];
}

export interface IProgressionLevel {
  level: CompetencyLevel;
  description: string;
  indicators: string[];
}

export interface IGrowthTask {
  [key: string]: any;
  id: string;
  userId: string;
  description: string;
  sourceSessionId: string;
  completed: boolean;
  createdAt: Date;
}