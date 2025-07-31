import type { ICase, ICompetencyProgress, ISimulationSession, CaseSlug, IConversationMessage, IFeedbackReport } from "../../../../packages/types";

const API_BASE_URL = "http://localhost:3001/api";

export const getCases = async (userId: string): Promise<ICase[]> => {
  const response = await fetch(`${API_BASE_URL}/cases/${userId}`);
  if (!response.ok) throw new Error('Error al obtener los casos');
  return response.json();
};

export const getUserProgress = async (
  userId: string
): Promise<ICompetencyProgress[]> => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/progress`);
  if (!response.ok) throw new Error("Error al obtener el progreso del usuario");
  return response.json();
};

export const getBriefing = async (caseId: string, level: string): Promise<{ briefing: string }> => {
  const response = await fetch(`${API_BASE_URL}/briefing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId, level }),
  });
  if (!response.ok) throw new Error('Error al obtener el briefing');
  return response.json();
};

export const startSession = async (caseSlug: string, userId: string): Promise<ISimulationSession> => {
  console.log(`🚀 API: Iniciando sesión para caso ${caseSlug}, usuario ${userId}`);
  
  const response = await fetch(`${API_BASE_URL}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseSlug, userId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
    console.error('❌ Error al iniciar sesión:', errorMessage);
    throw new Error(`Error al iniciar la sesión: ${errorMessage}`);
  }
  
  const session = await response.json();
  console.log('✅ Sesión iniciada exitosamente:', session.id);
  return session;
};

export const getActiveSessions = async (userId: string): Promise<ISimulationSession[]> => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/active-sessions`);
  if (!response.ok) {
    console.error("No se pudieron obtener las sesiones activas, pero no es un error crítico.");
    return []; // Devolvemos un array vacío para no romper la app
  }
  return response.json();
};

export const getSession = async (sessionId: string): Promise<ISimulationSession> => {
  const response = await fetch(`${API_BASE_URL}/session/${sessionId}`);
  if (!response.ok) {
    throw new Error('Error al obtener la sesión');
  }
  return response.json();
};

// --- LA FUNCIÓN DUPLICADA HA SIDO ELIMINADA ---

interface TurnResponse {
  status: 'in_progress' | 'completed';
  ai_message: IConversationMessage;
  next_action: 'continue' | 'evaluation';
  message: string;
  total_exchanges?: number;
}

export const sendTurn = async (sessionId: string, content: string): Promise<TurnResponse> => {
  console.log(`📤 API: Enviando turno a sesión ${sessionId}`, { content: content.substring(0, 50) + '...' });
  
  const response = await fetch(`${API_BASE_URL}/session/${sessionId}/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ API: Error al procesar turno:', errorData);
    
    if (errorData.code === 'RECURSION_LIMIT') {
      return {
        status: 'completed',
        ai_message: { sender: 'ai', content: 'La simulación ha alcanzado su límite.', timestamp: new Date() },
        next_action: 'evaluation',
        message: 'Simulación finalizada por límite de recursión.'
      };
    }
    
    throw new Error(errorData.error || 'Error al procesar el turno');
  }
  
  const result = await response.json();
  console.log(`✅ API: Turno procesado exitosamente`, { status: result.status, next_action: result.next_action });
  return result;
};

export const finalizeSession = async (sessionId: string, feedback: IFeedbackReport): Promise<IFeedbackReport> => {
  console.log(`Frontend: Finalizando sesión ${sessionId} con feedback...`);
  const response = await fetch(`${API_BASE_URL}/session/${sessionId}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });
  if (!response.ok) {
    throw new Error('Error al finalizar la simulación');
  }
  return response.json();
};

export const evaluateSession = async (sessionId: string): Promise<IFeedbackReport> => {
  console.log(`Frontend: Solicitando evaluación para la sesión ${sessionId}`);
  const response = await fetch(`${API_BASE_URL}/session/${sessionId}/evaluate`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Error al solicitar la evaluación de la sesión');
  }
  return response.json();
};

export const getSessionHistory = async (userId: string): Promise<ISimulationSession[]> => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/history`);
  if (!response.ok) {
    console.error("Error al obtener el historial de sesiones.");
    return [];
  }
  return response.json();
};

export const getGrowthPlan = async (userId: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/growth-plan`);
  if (!response.ok) {
    throw new Error('Error al obtener el plan de crecimiento');
  }
  return response.json();
};

export const toggleTask = async (taskId: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/task/${taskId}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Error al cambiar el estado de la tarea');
  }
  return response.json();
};