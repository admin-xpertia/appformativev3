import { Surreal, RecordId } from 'surrealdb';
import type { ICase, ILevel } from '@espacio-formativo/types';
import {
  CaseSlug,
  CompetencyLevel,
  IConversationMessage,
  IFeedbackReport,
  ISimulationSession,
} from '@espacio-formativo/types';

const db = new Surreal();

export async function connectToDB() {
  try {
    console.log('Estableciendo conexión con SurrealDB Cloud…');
    await db.connect(process.env.DB_URL!, {
      namespace: process.env.DB_NAMESPACE!,
      database: process.env.DB_DATABASE!,
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
  const id = `${slug}:${Date.now()}`;
  const rid = new RecordId('session', id);
  const now = new Date();

  console.log(`🎯 Creando sesión con ID: ${id}`);
  console.log(`📊 Datos de la sesión:`, {
    userId,
    caseSlug: slug,
    level: CompetencyLevel.BRONCE,
    attemptNumber: 1,
    status: 'in_progress',
    startTime: now,
    // ✅ NO incluir endTime - SurrealDB lo marcará como NONE automáticamente
  });

  // ✅ CORRECCIÓN: Omitir endTime completamente para que SurrealDB use NONE
  await db.create(rid, {
    userId,
    caseSlug: slug,
    level: CompetencyLevel.BRONCE,
    attemptNumber: 1,
    status: 'in_progress',
    startTime: now,
    passed: false,
    // endTime: NO incluir este campo - SurrealDB manejará el option<datetime> como NONE
  });

  console.log(`✅ Sesión creada exitosamente en la BD`);

  return {
    id,
    userId,
    case: slug,
    level: CompetencyLevel.BRONCE,
    attemptNumber: 1,
    startTime: now,
    endTime: undefined, // ✅ En el objeto retornado, undefined indica sesión activa
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
  const sessionRid = new RecordId('session', sessionId);
  const sessions = await db.select<any>(sessionRid);
  if (!sessions.length) throw new Error('Sesión no encontrada');
  const raw = sessions[0] as any;

  // Leer mensajes asociados
  const allMessages = await db.select<any>('message');
  const rawMessages = allMessages.filter((m: any) => {
    const sid = m.sessionId as RecordId<string>;
    return sid.tb === 'session' && sid.id === sessionId;
  });

  const messages: IConversationMessage[] = rawMessages.map((m: any) => ({
    sender: m.sender as 'user' | 'ai',
    content: String(m.content),
    timestamp: new Date(m.timestamp),
  }));

  return {
    id: sessionId,
    userId: String(raw.userId),
    case: raw.caseSlug as CaseSlug,
    level: raw.level as CompetencyLevel,
    attemptNumber: Number(raw.attemptNumber),
    startTime: new Date(raw.startTime),
    endTime: raw.endTime ? new Date(raw.endTime) : undefined,
    conversationHistory: messages,
    passed: Boolean(raw.passed),
  };
}

/**
 * Añade un mensaje a la sesión (usuario o IA).
 */
export async function appendMessage(
  sessionId: string,
  msg: { sender: 'user' | 'ai'; content: string }
): Promise<IConversationMessage> {
  const now = new Date();
  const messageId = `${sessionId}:${now.getTime()}`;
  const rid = new RecordId('message', messageId);

  await db.create(rid, {
    sessionId: new RecordId('session', sessionId),
    sender: msg.sender,
    content: msg.content,
    timestamp: now,
  });

  return {
    sender: msg.sender,
    content: msg.content,
    timestamp: now,
  };
}

/**
 * Finaliza la sesión guardando el feedback.
 */
export async function finalizeSession(
  sessionId: string,
  feedback: IFeedbackReport
): Promise<IFeedbackReport> {
  const fbRid = new RecordId('feedback', sessionId);

  await db.create(fbRid, {
    sessionId: new RecordId('session', sessionId),
    generalCommentary: feedback.generalCommentary,
    competencyFeedback: feedback.competencyFeedback,
    recommendations: feedback.recommendations,
  });

  await db.update(
    new RecordId('session', sessionId),
    {
      status: 'completed',
      endTime: new Date(),
      passed: feedback.competencyFeedback.every(
        (c) =>
          c.achievedLevel === CompetencyLevel.ORO ||
          c.achievedLevel === CompetencyLevel.PLATINO
      ),
    }
  );

  return feedback;
}

/**
 * Devuelve el feedback final de una sesión.
 */
export async function getFeedback(
  sessionId: string
): Promise<IFeedbackReport | null> {
  const fbs = await db.select<any>(new RecordId('feedback', sessionId));
  if (!fbs.length) return null;
  const raw = fbs[0] as any;
  return {
    generalCommentary: String(raw.generalCommentary),
    competencyFeedback: raw.competencyFeedback as IFeedbackReport['competencyFeedback'],
    recommendations: raw.recommendations as string[],
  };
}

/**
 * Obtiene todos los casos.
 */
export async function getAllCases(): Promise<ICase[]> {
  try {
    const cases = await db.select<any>('case');
    
    // Limpiar los IDs para remover prefijos y caracteres Unicode
    const cleanedCases = cases.map((caseItem: any) => {
      let cleanId = caseItem.id;
      
      // Si el ID es un objeto RecordId, extraer solo la parte del ID
      if (typeof cleanId === 'object' && cleanId.id) {
        cleanId = cleanId.id;
      }
      
      // Si es string, limpiar prefijos y caracteres Unicode
      if (typeof cleanId === 'string') {
        // Remover prefijo "case:" si existe
        cleanId = cleanId.replace(/^case:/, '');
        // Remover caracteres Unicode ⟨ y ⟩ (códigos 10216 y 10217)
        cleanId = cleanId.replace(/⟨|⟩/g, '');
      }
      
      return {
        ...caseItem,
        id: cleanId
      };
    });
    
    console.log('✅ Casos obtenidos y limpiados:', cleanedCases.map(c => ({ id: c.id, title: c.title })));
    return cleanedCases as ICase[];
  } catch (error) {
    console.error('❌ Error al obtener los casos desde la DB:', error);
    return [];
  }
}

/**
 * Obtiene un caso específico por su slug.
 * @param caseSlug El slug del caso (ej. "la-boleta").
 * @returns Una promesa que se resuelve con la información del caso.
 */
export async function getCaseBySlug(caseSlug: string): Promise<ICase | null> {
  try {
    console.log(`🔍 Buscando caso con slug: ${caseSlug}`);
    
    // Usar db.query para buscar por slug con SurrealQL
    const query = 'SELECT * FROM case WHERE slug = $slug LIMIT 1;';
    const result = await db.query(query, {
      slug: caseSlug,
    });

    console.log('🔍 DEBUG - Query caso ejecutada:', query);
    console.log('🔍 DEBUG - Parámetros caso:', { slug: caseSlug });
    console.log('🔍 DEBUG - Resultado caso completo:', JSON.stringify(result, null, 2));

    // Extraer el caso usando la misma estructura que funciona para levels
    const queryResult = result as any[];
    let caseInfo = queryResult[0]?.[0] || null;
    
    if (caseInfo) {
      // Limpiar el ID del caso también
      let cleanId = caseInfo.id;
      if (typeof cleanId === 'object' && cleanId.id) {
        cleanId = cleanId.id;
      }
      if (typeof cleanId === 'string') {
        cleanId = cleanId.replace(/^case:/, '');
        cleanId = cleanId.replace(/⟨|⟩/g, '');
      }
      
      caseInfo = {
        ...caseInfo,
        id: cleanId
      };
    }

    console.log(`✅ Caso encontrado para slug ${caseSlug}:`, caseInfo ? { id: caseInfo.id, title: caseInfo.title } : null);
    return caseInfo;
  } catch (error) {
    console.error("❌ Error al obtener la información del caso:", error);
    return null;
  }
}

/**
 * Obtiene la información de un nivel específico para un caso.
 * @param caseSlug El slug del caso (ej. "la-boleta").
 * @param level El nivel a obtener (ej. "bronce").
 * @returns Una promesa que se resuelve con la información del nivel.
 */
export async function getLevelInfo(
  caseSlug: string,
  level: string
): Promise<ILevel | null> {
  try {
    // --- INICIO DE LA CORRECCIÓN CLAVE ---
    // Usamos db.query para ejecutar SurrealQL nativo, tal como lo descubriste.
    // Pasamos los valores como variables ($slug, $level) para seguridad.
    const query = 'SELECT * FROM level WHERE caseSlug = $slug AND level = $level LIMIT 1;';
    const result = await db.query(query, {
      slug: caseSlug,
      level: level,
    });

    // DEBUG: Vamos a ver exactamente qué devuelve db.query
    console.log('🔍 DEBUG - Query ejecutada:', query);
    console.log('🔍 DEBUG - Parámetros:', { slug: caseSlug, level: level });
    console.log('🔍 DEBUG - Resultado completo de db.query:', JSON.stringify(result, null, 2));
    console.log('🔍 DEBUG - Tipo de resultado:', typeof result);
    console.log('🔍 DEBUG - Es array?:', Array.isArray(result));
    if (Array.isArray(result) && result.length > 0) {
      const firstElement = result[0] as any;
      console.log('🔍 DEBUG - Primer elemento:', JSON.stringify(firstElement, null, 2));
      console.log('🔍 DEBUG - result[0].result existe?:', firstElement?.result !== undefined);
      if (firstElement?.result) {
        console.log('🔍 DEBUG - result[0].result:', JSON.stringify(firstElement.result, null, 2));
      }
    }

    // --- CORRECCIÓN: La estructura real es result[0][0], no result[0].result[0] ---
    const queryResult = result as any[];
    const levelInfo = queryResult[0]?.[0] || null;
    console.log('✅ CORRECCIÓN - Extrayendo result[0][0]:', levelInfo);
    console.log(`Resultado de la consulta de nivel para ${caseSlug}/${level}:`, levelInfo);
    return levelInfo;
    // --- FIN DE LA CORRECCIÓN CLAVE ---

  } catch (error) {
    console.error("❌ Error al obtener la información del nivel:", error);
    return null;
  }
}

export { db };