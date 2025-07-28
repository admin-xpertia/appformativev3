import { CaseSlug, CompetencySlug, CompetencyLevel } from "./enums";

/**
 * Representa la estructura de un caso de simulación individual.
 * ESTA ES LA INTERFAZ QUE FALTABA.
 */
export interface ICase {
  id: CaseSlug;
  title: string;
  currentLevel: CompetencyLevel;
  attempts: string;
  progress: number;
  available: boolean;
  lastAttempt?: string;
}

/**
 * Representa el progreso del usuario en UNA competencia específica.
 * ESTA ES LA INTERFAZ CORREGIDA para el progreso.
 */
export interface ICompetencyProgress {
  competency: CompetencySlug;
  progress: number;
  level: CompetencyLevel;
}

// --- El resto de las interfaces se mantienen igual ---

export interface IConversationMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface ICompetencyFeedback {
  competency: CompetencySlug;
  achievedLevel: CompetencyLevel;
  strengths: string[];
  areasForImprovement: string[];
  justification: string;
}

export interface IFeedbackReport {
  generalCommentary: string;
  competencyFeedback: ICompetencyFeedback[];
  recommendations: string[];
}

export interface ISimulationSession {
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