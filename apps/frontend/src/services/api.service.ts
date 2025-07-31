// src/services/api.service.ts
import type { ICase, ICompetencyProgress, ISimulationSession, CaseSlug, IConversationMessage, IFeedbackReport } from "../../../../packages/types";

const API_BASE_URL = "http://localhost:3001/api";

export const getCases = async (): Promise<ICase[]> => {
  const response = await fetch(`${API_BASE_URL}/cases`);
  if (!response.ok) throw new Error("Error al obtener los casos");
  const data = (await response.json()) as Array<{
    id: { tb: string; id: string } | string;
    slug: CaseSlug;
    title: string;
  }>;

  return data.map((c) => {
    // Extraemos el string real del RecordId
    const rawId = typeof c.id === "object" ? c.id.id : c.id;
    // Ahora castea ambos al tipo CaseSlug
    const slug  = c.slug as CaseSlug;
    const id    = rawId as CaseSlug;

    return {
      id,
      slug,
      title: c.title,
      available: true,
      progress: 0,
    };
  });
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

// 🔥 INTERFAZ ACTUALIZADA para manejar las nuevas respuestas
interface TurnResponse {
  status: 'in_progress' | 'completed';
  ai_message: IConversationMessage;
  next_action: 'continue' | 'evaluation'; // 🔥 NUEVO: Acción específica
  message: string; // 🔥 NUEVO: Mensaje descriptivo
  total_exchanges?: number; // 🔥 NUEVO: Contador de intercambios
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
    
    // 🔥 MANEJO ESPECÍFICO del error de recursión
    if (errorData.code === 'RECURSION_LIMIT') {
      return {
        status: 'completed',
        ai_message: {
          sender: 'ai',
          content: 'La simulación ha alcanzado su límite. Procedamos a la evaluación.',
          timestamp: new Date()
        },
        next_action: 'evaluation',
        message: 'Simulación finalizada por límite de recursión.'
      };
    }
    
    throw new Error(errorData.error || 'Error al procesar el turno');
  }
  
  const result = await response.json();
  console.log(`✅ API: Turno procesado exitosamente`, { 
    status: result.status, 
    next_action: result.next_action 
  });
  
  return result;
};

// 🔥 NUEVA FUNCIÓN: Finalizar simulación manualmente
export const finalizeSession = async (sessionId: string, feedback: IFeedbackReport): Promise<IFeedbackReport> => {
  console.log(`Frontend: Finalizando sesión ${sessionId} con feedback...`);
  const response = await fetch(`${API_BASE_URL}/session/${sessionId}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // --- LA CORRECCIÓN CLAVE ---
    // Incluimos el informe de feedback en el cuerpo de la petición.
    body: JSON.stringify(feedback),
    // --- FIN DE LA CORRECCIÓN ---
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