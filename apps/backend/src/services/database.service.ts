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

// === ❸ UTILIDADES DRY ===
// Helper para encontrar el RecordId de una sesión
async function findSessionRecordId(sessionId: string): Promise<RecordId> {
  const query = 'SELECT id FROM session WHERE record::id(id) = $sessionId LIMIT 1;';
  const result = await db.query<[{ id: RecordId }[]]>(query, { sessionId });
  
  if (!result[0]?.[0]) {
    throw new Error(`Sesión ${sessionId} no encontrada`);
  }
  
  return result[0][0].id;
}

// Helper para crear thing reference
function createSessionThing(sessionId: string): string {
  return `session:${sessionId}`;
}

// === ❹ VALIDACIÓN DE ENV VARS ===
function validateEnvVars() {
  const required = ['DB_URL', 'DB_NAMESPACE', 'DB_DATABASE', 'DB_USER', 'DB_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }
}

// === ❻ LOGGING MEJORADO ===
const logger = {
  info: (msg: string, data?: any) => console.log(`ℹ️ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (msg: string, error?: any) => console.error(`❌ ${msg}`, error),
  debug: (msg: string, data?: any) => console.log(`🔍 ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  success: (msg: string, data?: any) => console.log(`✅ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
};

// Función auxiliar para limpiar IDs de casos
function cleanCaseId(id: any): CaseSlug {
  let cleanId = id;
  
  if (typeof cleanId === 'object' && cleanId.id) {
    cleanId = cleanId.id;
  }
  
  if (typeof cleanId === 'string') {
    cleanId = cleanId.replace(/^case:/, '');
    cleanId = cleanId.replace(/⟨|⟩/g, '');
  }
  
  return cleanId as CaseSlug;
}

// === TIPOS PARA LA BASE DE DATOS ===
type SessionRow = {
  id?: RecordId | string;
  userId: string;
  caseSlug: CaseSlug;
  level: CompetencyLevel;
  attemptNumber: number;
  startTime: string | Date;
  endTime?: string | Date;
  passed: boolean;
  status: string;
};

type MessageRow = {
  id?: RecordId | string;
  sessionId: RecordId | string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string | Date;
};

type FeedbackRow = {
  id?: RecordId | string;
  sessionId: RecordId | string;
  generalCommentary: string;
  competencyFeedback: IFeedbackReport['competencyFeedback'];
  recommendations: string[];
};

type NewSessionData = {
  userId: string;
  caseSlug: CaseSlug;
  level: CompetencyLevel;
  attemptNumber: number;
  status: string;
  startTime: Date; // ❺ Date object para SurrealDB
  passed: boolean;
};

// === ❺ UTILIDADES PARA FECHAS COHERENTES ===
// Para SurrealDB: enviamos Date objects directamente
// Para output al frontend: convertimos a Date objects
function toISOString(date: Date): string {
  return date.toISOString();
}

function parseDate(dateInput: string | Date): Date {
  return dateInput instanceof Date ? dateInput : new Date(dateInput);
}

export async function connectToDB() {
  try {
    // ❹ Validar variables de entorno primero
    validateEnvVars();
    
    logger.info('Estableciendo conexión con SurrealDB Cloud…');
    
    await db.connect(process.env.DB_URL!, {
      namespace: process.env.DB_NAMESPACE!,
      database: process.env.DB_DATABASE!,
      auth: {
        username: process.env.DB_USER!,
        password: process.env.DB_PASS!,
      },
    });
    
    await db.ready;
    logger.success('Conexión WebSocket establecida');
  } catch (e) {
    logger.error('ERROR AL ESTABLECER CONEXIÓN', e);
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
  const now = new Date();

  const newSessionData: NewSessionData = {
    userId,
    caseSlug: slug,
    level: CompetencyLevel.BRONCE,
    attemptNumber: 1,
    status: 'in_progress',
    startTime: now, // ❅ Date object directo para SurrealDB
    passed: false,
  };

  try {
    logger.info('Creando sesión en la tabla session', { userId, caseSlug: slug });
    
    // ❹ Con tipado genérico para mejor type safety
    const createdRecords = await db.create<SessionRow>("session", newSessionData);

    let createdSession: SessionRow;
    if (Array.isArray(createdRecords)) {
      if (createdRecords.length === 0) {
        throw new Error("La creación de la sesión no devolvió un registro.");
      }
      createdSession = createdRecords[0];
    } else {
      createdSession = createdRecords;
    }
    
    // ❶ Usar record::id en lugar de string::split
    const sessionId = String(createdSession.id).split(':')[1] || '';
    
    logger.success('Sesión creada en la BD', { sessionId });
    
    const finalSession: ISimulationSession = {
      id: sessionId,
      userId: String(createdSession.userId),
      case: createdSession.caseSlug,
      level: createdSession.level,
      attemptNumber: Number(createdSession.attemptNumber),
      startTime: parseDate(createdSession.startTime), // ❅ Conversión coherente
      endTime: createdSession.endTime ? parseDate(createdSession.endTime) : undefined,
      conversationHistory: [],
      passed: Boolean(createdSession.passed),
    };

    return finalSession;

  } catch (error) {
    logger.error('Error durante la creación de la sesión', error);
    throw error;
  }
}

/**
 * ❷ Recupera una sesión junto con su historial de mensajes (SIN full-table scan).
 */
export async function getSession(sessionId: string): Promise<ISimulationSession> {
  try {
    // ❶ Usar la misma sintaxis que funciona en otras partes del código
    const sessionQuery = 'SELECT * FROM session WHERE record::id(id) = $sessionId LIMIT 1;';
    const sessionResponse = await db.query<[SessionRow[]]>(sessionQuery, {
      sessionId: sessionId
    });

    const rawSession = sessionResponse?.[0]?.[0];

    if (!rawSession) {
      throw new Error(`Sesión con ID '${sessionId}' no encontrada.`);
    }

    logger.debug('Sesión encontrada en getSession', { 
      sessionId, 
      rawSession: { id: rawSession.id, userId: rawSession.userId } 
    });

    // ❷ CRÍTICO: Query optimizada para mensajes usando record::id consistente
    const messagesQuery = `
      SELECT * FROM message 
      WHERE record::id(sessionId) = $sessionId 
      ORDER BY timestamp ASC
    `;
    
    const messagesResponse = await db.query<[MessageRow[]]>(messagesQuery, {
      sessionId: sessionId
    });

    const rawMessages = messagesResponse[0] || [];

    const messages: IConversationMessage[] = rawMessages.map((m: MessageRow) => ({
      sender: m.sender,
      content: String(m.content),
      timestamp: parseDate(m.timestamp), // ❅ Conversión coherente
    }));

    logger.success('Sesión recuperada', { 
      sessionId, 
      messageCount: messages.length 
    });

    return {
      id: sessionId,
      userId: String(rawSession.userId),
      case: rawSession.caseSlug,
      level: rawSession.level,
      attemptNumber: Number(rawSession.attemptNumber),
      startTime: parseDate(rawSession.startTime), // ❅ Conversión coherente
      endTime: rawSession.endTime ? parseDate(rawSession.endTime) : undefined,
      conversationHistory: messages,
      passed: Boolean(rawSession.passed),
    };

  } catch (error) {
    logger.error(`Error al obtener la sesión ${sessionId}`, error);
    throw error;
  }
}

/**
 * ❶❸ Añade un mensaje a la sesión usando helper DRY.
 */
export async function appendMessage(
  sessionId: string,
  msg: { sender: 'user' | 'ai'; content: string }
): Promise<IConversationMessage> {
  const now = new Date();
  
  logger.info('Añadiendo mensaje a sesión', { sessionId, sender: msg.sender });

  try {
    // ❸ Usar helper DRY
    const sessionRecordId = await findSessionRecordId(sessionId);
    
    logger.debug('Sesión encontrada', { sessionRecordId });

    // ❼ En el futuro, esto podría ir en una transacción
    await db.create<MessageRow>("message", {
      sessionId: sessionRecordId,
      sender: msg.sender,
      content: msg.content,
      timestamp: now, // ❅ Date object directo para SurrealDB
    });

    logger.success('Mensaje añadido exitosamente', { sessionId });

    return {
      sender: msg.sender,
      content: msg.content,
      timestamp: now,
    };
  } catch (error) {
    logger.error(`Error al añadir mensaje a sesión ${sessionId}`, error);
    throw error;
  }
}

/**
 * ❶❃ Finaliza la sesión usando helper DRY.
 */
export async function finalizeSession(
  sessionId: string,
  feedback: IFeedbackReport
): Promise<IFeedbackReport> {
  logger.info('Finalizando sesión', { sessionId });

  try {
    // ❸ Usar helper DRY
    const sessionRecordId = await findSessionRecordId(sessionId);
    
    logger.debug('Sesión encontrada para finalizar', { sessionRecordId });

    // ❼ En el futuro, estas operaciones podrían ir en una transacción
    await db.create<FeedbackRow>("feedback", {
      sessionId: sessionRecordId,
      generalCommentary: feedback.generalCommentary,
      competencyFeedback: feedback.competencyFeedback,
      recommendations: feedback.recommendations,
    });

    // ❶ Usar record::id en lugar de string::split
    const updateQuery = `
      UPDATE session 
      SET status = $status, endTime = $endTime, passed = $passed 
      WHERE record::id(id) = $sessionId
    `;
    
    await db.query(updateQuery, {
      sessionId: sessionId,
      status: 'completed',
      endTime: new Date(), // ❅ Date object directo para SurrealDB
      passed: feedback.competencyFeedback.every(
        (c) =>
          c.achievedLevel === CompetencyLevel.ORO ||
          c.achievedLevel === CompetencyLevel.PLATINO
      ),
    });

    logger.success('Sesión finalizada exitosamente', { sessionId });

    return feedback;
  } catch (error) {
    logger.error(`Error al finalizar sesión ${sessionId}`, error);
    throw error;
  }
}

/**
 * ❁ Devuelve el feedback final de una sesión.
 */
export async function getFeedback(sessionId: string): Promise<IFeedbackReport | null> {
  logger.info('Buscando feedback para sesión', { sessionId });

  try {
    // ❶ CRÍTICO: Usar record::id en lugar de string::split
    const feedbackQuery = `
      SELECT * FROM feedback 
      WHERE record::id(sessionId) = $sessionId 
      LIMIT 1
    `;
    
    const result = await db.query<[FeedbackRow[]]>(feedbackQuery, {
      sessionId: sessionId,
    });

    const rawFeedbackRecord = result[0]?.[0];

    if (!rawFeedbackRecord) {
      logger.info('No se encontró feedback para sesión', { sessionId });
      return null;
    }

    logger.success('Feedback encontrado para sesión', { sessionId });

    return {
      generalCommentary: String(rawFeedbackRecord.generalCommentary || ''),
      competencyFeedback: rawFeedbackRecord.competencyFeedback,
      recommendations: Array.isArray(rawFeedbackRecord.recommendations) 
        ? rawFeedbackRecord.recommendations.map((r: any) => String(r)) 
        : [],
    };
  } catch (error) {
    logger.error(`Error al obtener feedback de sesión ${sessionId}`, error);
    throw error;
  }
}

/**
 * Obtiene todos los casos.
 */
export async function getAllCases(): Promise<ICase[]> {
  try {
    const cases = await db.select<any>('case');
    
    const cleanedCases: ICase[] = cases.map((caseItem: any) => {
      return {
        ...caseItem,
        id: cleanCaseId(caseItem.id)
      };
    });
    
    logger.success('Casos obtenidos y limpiados', { 
      count: cleanedCases.length,
      cases: cleanedCases.map(c => ({ 
        id: c.id as string,
        title: c.title 
      }))
    });
    
    return cleanedCases;
  } catch (error) {
    logger.error('Error al obtener los casos desde la DB', error);
    return [];
  }
}

/**
 * Obtiene un caso específico por su slug.
 */
export async function getCaseBySlug(caseSlug: string): Promise<ICase | null> {
  try {
    logger.info('Buscando caso con slug', { caseSlug });
    
    const query = 'SELECT * FROM case WHERE slug = $slug LIMIT 1;';
    const result = await db.query<[any[]]>(query, {
      slug: caseSlug,
    });

    logger.debug('Query caso ejecutada', { query, params: { slug: caseSlug } });

    let caseInfo = result[0]?.[0] || null;
    
    if (caseInfo) {
      caseInfo = {
        ...caseInfo,
        id: cleanCaseId(caseInfo.id)
      };
    }

    logger.success('Caso encontrado para slug', { 
      caseSlug, 
      found: !!caseInfo,
      case: caseInfo ? { id: caseInfo.id as string, title: caseInfo.title } : null 
    });
    
    return caseInfo;
  } catch (error) {
    logger.error('Error al obtener la información del caso', error);
    return null;
  }
}

/**
 * Obtiene la información de un nivel específico para un caso.
 */
export async function getLevelInfo(
  caseSlug: string,
  level: string
): Promise<ILevel | null> {
  try {
    const query = 'SELECT * FROM level WHERE caseSlug = $slug AND level = $level LIMIT 1;';
    const result = await db.query<[ILevel[]]>(query, {
      slug: caseSlug,
      level: level,
    });

    logger.debug('Query nivel ejecutada', { 
      query, 
      params: { slug: caseSlug, level: level },
      result: result 
    });

    const levelInfo = result[0]?.[0] || null;
    
    logger.success('Resultado de la consulta de nivel', {
      caseSlug,
      level,
      found: !!levelInfo,
      levelInfo
    });
    
    return levelInfo;

  } catch (error) {
    logger.error('Error al obtener la información del nivel', error);
    return null;
  }
}

/**
 * Obtiene la rúbrica de evaluación completa para un nivel específico.
 * Consulta las tablas 'competency' y 'competency_progression'.
 */
export async function getCompetencyRubric(level: CompetencyLevel): Promise<any[]> {
  try {
    // Esta consulta une las dos tablas para obtener la descripción de la competencia
    // y la descripción del nivel (que usaremos como indicador).
    const query = `
      SELECT 
        c.name as competencyName,
        c.slug as competencySlug,
        cp.level,
        cp.description as indicator
      FROM competency AS c 
      INNER JOIN competency_progression AS cp ON c.slug = cp.competencySlug
      WHERE cp.level = $level;
    `;
    const result = await db.query<[any[]]>(query, { level });
    const rubric = result[0] || [];
    
    logger.success(`Rúbrica obtenida para el nivel ${level}`, { count: rubric.length });
    return rubric;
  } catch (error) {
    logger.error(`Error al obtener la rúbrica para el nivel ${level}`, error);
    return [];
  }
}

/**
 * Obtiene el progreso actual de un usuario para un caso específico.
 */
export async function getUserProgress(userId: string, caseSlug: CaseSlug) {
  try {
    const query = 'SELECT * FROM user_progress WHERE userId = $userId AND caseSlug = $caseSlug LIMIT 1;';
    const result = await db.query<[any[]]>(query, { userId, caseSlug });
    
    const progressRecord = result[0]?.[0] || null;
    
    logger.success('Progreso de usuario consultado', { 
      userId, 
      caseSlug, 
      found: !!progressRecord 
    });
    
    return progressRecord;
  } catch (error) {
    logger.error(`Error al obtener progreso de usuario ${userId} para caso ${caseSlug}`, error);
    return null;
  }
}

/**
 * Actualiza el progreso de un usuario o crea un nuevo registro si no existe.
 */
export async function updateUserProgress(userId: string, caseSlug: CaseSlug, newLevel: CompetencyLevel, highestLevelCompleted: CompetencyLevel) {
  try {
    const progressRecord = await getUserProgress(userId, caseSlug);

    if (progressRecord) {
      // Si ya existe, lo actualizamos
      const recordId = (progressRecord as any).id;
      await db.merge(recordId, {
        currentLevel: newLevel,
        highestLevelCompleted: highestLevelCompleted,
      });
      logger.success('Progreso de usuario actualizado', { userId, caseSlug, newLevel });
    } else {
      // Si no existe, creamos un nuevo registro
      await db.create('user_progress', {
        userId,
        caseSlug,
        currentLevel: newLevel,
        highestLevelCompleted,
      });
      logger.success('Progreso de usuario creado', { userId, caseSlug, newLevel });
    }
  } catch (error) {
    logger.error(`Error al actualizar progreso de usuario ${userId} para caso ${caseSlug}`, error);
    throw error;
  }
}

// ❿ Para testing - Queries de validación que puedes usar en smoke tests
export const VALIDATION_QUERIES = {
  testRecordId: (sessionId: string) => 
    `SELECT id FROM session WHERE record::id(id) = '${sessionId}';`,
  
  testMetaId: (sessionId: string) => 
    `SELECT id FROM session WHERE meta::id(id) = '${sessionId}';`,
  
  testTypeThing: (sessionId: string) => `
    LET $sid = type::thing('session', '${sessionId}');
    SELECT * FROM session WHERE id = $sid;
  `,
  
  testMessageQuery: (sessionId: string) => `
    LET $sid = type::thing('session', '${sessionId}');
    SELECT * FROM message WHERE sessionId = $sid ORDER BY timestamp;
  `
};

export { db };