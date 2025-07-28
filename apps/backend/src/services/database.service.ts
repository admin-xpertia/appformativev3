import { Surreal, RecordId } from 'surrealdb';
import {
  CaseSlug,
  CompetencyLevel,
  IConversationMessage,
  IFeedbackReport,
  ISimulationSession
} from '@espacio-formativo/types';

const db = new Surreal();

export async function connectToDB() {
  try {
    console.log('Estableciendo conexión con SurrealDB Cloud…');
    await db.connect(process.env.DB_URL!, {
      namespace: process.env.DB_NAMESPACE!,
      database:  process.env.DB_DATABASE!,
      auth: {
        username: process.env.DB_USER!,
        password: process.env.DB_PASS!,
      },
    });
    await db.ready;
    console.log('✅ Conexión WebSocket establecida.');
  } catch (e) {
    console.error('❌ ERROR AL ESTABLECER CONEXIÓN:', e);
    throw e;
  }
}

/**
 * Crea una nueva sesión de simulación.
 */
export async function createSession(
  userId: string,
  caseSlug: string
): Promise<ISimulationSession> {
  const slug = caseSlug as CaseSlug;
  const id   = `${slug}:${Date.now()}`;
  const rid  = new RecordId('session', id);
  const now  = new Date();
  
  // Usar una fecha muy lejana en el futuro para indicar "en progreso"
  const placeholderEndTime = new Date('2099-12-31T23:59:59.999Z');

  await db.create(rid, {
    userId,
    caseSlug: slug,
    level: CompetencyLevel.BRONCE,
    attemptNumber: 1,
    status: 'in_progress',
    startTime: now,
    endTime: placeholderEndTime,  // Fecha placeholder
    passed: false,
  });

  return {
    id,
    userId,
    case: slug,
    level: CompetencyLevel.BRONCE,
    attemptNumber: 1,
    startTime: now,
    conversationHistory: [],
    passed: false,
  };
}

/**
 * Recupera una sesión junto con su historial de mensajes.
 */
export async function getSession(
  sessionId: string
): Promise<ISimulationSession> {
  try {
    const rid = new RecordId('session', sessionId);
    
    // db.select con RecordId específico devuelve un objeto único, no array
    const sessionResult = await db.select<Record<string, any>>(rid);
    
    // Verificar si encontramos la sesión
    if (!sessionResult) {
      throw new Error(`Sesión ${sessionId} no encontrada`);
    }
    
    // sessionResult ya es el objeto de la sesión, no un array
    const raw = sessionResult;

    // Leer mensajes de la sesión
    const allMsgs = await db.select<Record<string, any>>('message');
    
    // Verificar si allMsgs es válido y filtrar mensajes
    const rawMessages = (allMsgs && Array.isArray(allMsgs)) 
      ? allMsgs.filter((m) => {
          const sid = m.sessionId as RecordId<string>;
          return sid && sid.tb === 'session' && sid.id === sessionId;
        })
      : [];

    const messages: IConversationMessage[] = rawMessages.map((m) => ({
      sender: m.sender as 'user' | 'ai',
      content: String(m.content),
      timestamp: new Date(m.timestamp),
    }));

    // Convertir la fecha placeholder a undefined
    const endTime = raw.endTime && new Date(raw.endTime).getFullYear() < 2099 
      ? new Date(raw.endTime) 
      : undefined;

    return {
      id: sessionId,
      userId: String(raw.userId),
      case: raw.caseSlug as CaseSlug,
      level: raw.level as CompetencyLevel,
      attemptNumber: Number(raw.attemptNumber),
      startTime: new Date(raw.startTime),
      endTime: endTime,
      conversationHistory: messages,
      passed: Boolean(raw.passed),
    };
    
  } catch (error) {
    console.error('Error in getSession:', error);
    throw error;
  }
}

/**
 * Añade un mensaje a la sesión (user o ai).
 */
export async function appendMessage(
  sessionId: string,
  msg: { sender: 'user' | 'ai'; content: string }
): Promise<void> {
  const rid = new RecordId('message', `${sessionId}:${Date.now()}`);
  await db.create(rid, {
    sessionId: new RecordId('session', sessionId),
    sender: msg.sender,
    content: msg.content,
    timestamp: new Date(),
  });
}

/**
 * Finaliza una sesión y guarda el feedback.
 * Devuelve el feedback guardado.
 */
export async function finalizeSession(
  sessionId: string,
  feedback: IFeedbackReport
): Promise<IFeedbackReport> {
  try {
    console.log('🔍 DEBUG finalizeSession - Input feedback:', JSON.stringify(feedback, null, 2));

    const fbRid = new RecordId('feedback', sessionId);
    
    // Eliminar feedback existente si existe
    try {
      await db.delete(fbRid);
      console.log('🔍 DEBUG finalizeSession - Deleted existing feedback');
    } catch (e) {
      console.log('🔍 DEBUG finalizeSession - No existing feedback to delete');
    }

    // Crear el feedback con todos los datos
    console.log('🔍 DEBUG finalizeSession - Creating feedback with data:', {
      generalCommentary: feedback.generalCommentary,
      competencyFeedback: feedback.competencyFeedback,
      recommendations: feedback.recommendations
    });

    const createResult = await db.create(fbRid, {
      sessionId: new RecordId('session', sessionId),
      generalCommentary: feedback.generalCommentary,
      competencyFeedback: feedback.competencyFeedback,
      recommendations: feedback.recommendations,
    });

    console.log('🔍 DEBUG finalizeSession - Create result:', JSON.stringify(createResult, null, 2));

    // Verificar inmediatamente que se guardó correctamente
    const savedFeedback = await db.select(fbRid);
    console.log('🔍 DEBUG finalizeSession - Saved feedback verification:', JSON.stringify(savedFeedback, null, 2));

    // Calcular si pasó la sesión
    const passed = feedback.competencyFeedback.every(
      (c) =>
        c.achievedLevel === CompetencyLevel.ORO ||
        c.achievedLevel === CompetencyLevel.PLATINO
    );

    console.log('🔍 DEBUG finalizeSession - Passed calculation:', passed);

    // Actualizar la sesión usando el RecordId directamente
    const sessionRid = new RecordId('session', sessionId);
    
    // Obtener la sesión actual para hacer merge manual
    const currentSession = await db.select(sessionRid);
    console.log('🔍 DEBUG finalizeSession - Current session:', currentSession);

    // Hacer update completo manteniendo todos los campos
    await db.update(sessionRid, {
      ...currentSession,
      status: 'completed',
      endTime: new Date(),
      passed: passed
    });

    console.log('✅ DEBUG finalizeSession - Session updated successfully');

    return feedback;
  } catch (error) {
    console.error('❌ DEBUG finalizeSession - Error:', error);
    throw error;
  }
}

/**
 * Devuelve el feedback final de una sesión.
 */
export async function getFeedback(
  sessionId: string
): Promise<IFeedbackReport | null> {
  try {
    console.log('🔍 DEBUG getFeedback - sessionId:', sessionId);

    const fbResult = await db.select<Record<string, any>>(
      new RecordId('feedback', sessionId)
    );
    
    console.log('🔍 DEBUG getFeedback - Raw result:', JSON.stringify(fbResult, null, 2));
    
    // db.select con RecordId específico devuelve un objeto único, no array
    if (!fbResult) {
      console.log('❌ DEBUG getFeedback - No feedback found');
      return null;
    }
    
    const result = {
      generalCommentary: String(fbResult.generalCommentary),
      competencyFeedback: fbResult.competencyFeedback as IFeedbackReport['competencyFeedback'],
      recommendations: fbResult.recommendations as string[],
    };

    console.log('🔍 DEBUG getFeedback - Final result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ DEBUG getFeedback - Error:', error);
    return null;
  }
}

/**
 * Obtiene todos los casos.
 */
export const getAllCases = async (): Promise<any[]> => {
  try {
    return await db.select('case');
  } catch (error) {
    console.error('❌ Error al obtener los casos desde la DB:', error);
    return [];
  }
};

export { db };
