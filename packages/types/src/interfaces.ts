import { CaseSlug, CompetencySlug, CompetencyLevel } from "./enums";

/**
 * Representa la estructura de un caso de simulación individual.
 */
export interface ICase {
  // --- CORRECCIÓN AÑADIDA ---
  // Satisface el requisito de la librería de base de datos
  [key: string]: any; 
  // --- FIN DE LA CORRECCIÓN ---

  id: CaseSlug;
  slug: string; // Añadido para consistencia con los datos de siembra
  title: string;
  currentLevel?: CompetencyLevel;
  attempts?: string;
  progress?: number;
  available?: boolean;
  lastAttempt?: string;
}

/**
 * Representa el progreso del usuario en UNA competencia específica.
 */
export interface ICompetencyProgress {
  // --- CORRECCIÓN AÑADIDA ---
  [key: string]: any; 
  // --- FIN DE LA CORRECCIÓN ---

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

export interface ILevel {
  [key: string]: any;
  id: string;
  case: string; // ID del caso al que pertenece, ej. "case:sobreconsumo"
  caseTitle: string;
  level: CompetencyLevel;
  objectives: string;
}