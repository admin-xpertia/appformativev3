// En packages/types/src/interfaces.ts
import { CaseSlug, CompetencySlug, CompetencyLevel } from "./enums";

export interface ICase {
  [key: string]: any;
  // --- INICIO DE LA CORRECCIÓN CLAVE ---
  id: string; // Cambiamos CaseSlug por string para mayor flexibilidad
  // --- FIN DE LA CORRECCIÓN CLAVE ---
  slug: CaseSlug; // Mantenemos el slug con el tipo estricto del enum
  title: string;
  currentLevel?: CompetencyLevel;
  attempts?: string;
  progress?: number;
  available?: boolean;
  lastAttempt?: string;
  status?: 'in_progress' | 'pending'; // ✅ NUEVO CAMPO OPCIONAL
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

// --- INICIO DE LA CORRECCIÓN ---
export interface ISimulationSession {
  [key: string]: any; // Añadimos la firma de índice
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
// --- FIN DE LA CORRECCIÓN ---

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

export interface IProgressionLevel {
  level: CompetencyLevel;
  description: string; // Descripción de lo que se espera en este nivel
  indicators: string[]; // Indicadores observables, ej: "Parafrasea al cliente"
}

export interface ICompetencyFeedback {
  competency: CompetencySlug;
  achievedLevel: CompetencyLevel;
  strengths: string[];
  areasForImprovement: string[];
  justification: string;
  meetsIndicators?: boolean; // ✅ CAMBIO AÑADIDO
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


