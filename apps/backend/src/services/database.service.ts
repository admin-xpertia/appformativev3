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
// Helper para encontrar el RecordId de una sesión - Robusto para ambos formatos
async function findSessionRecordId(sessionId: string): Promise<RecordId> {
  // ✅ Consulta robusta que maneja tanto IDs limpios como RecordIds completos
  const sessionRecordId = new RecordId('session', sessionId);
  const query = `
    SELECT id FROM session 
    WHERE (record::id(id) = $sessionId OR id = $sessionRecordId) 
    LIMIT 1
  `;
  
  logger.debug('Buscando sesión por ID', { 
    sessionId, 
    sessionRecordId: sessionRecordId.toString() 
  });
  
  const result = await db.query<[{ id: RecordId }[]]>(query, { 
    sessionId, 
    sessionRecordId 
  });
  
  if (!result[0]?.[0]) {
    logger.error(`Sesión ${sessionId} no encontrada`, { 
      searchedFor: { sessionId, sessionRecordId: sessionRecordId.toString() }
    });
    throw new Error(`Sesión ${sessionId} no encontrada`);
  }
  
  logger.debug('Sesión encontrada', { 
    foundId: result[0][0].id.toString() 
  });
  
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

// Función auxiliar para limpiar RecordId y extraer solo el ID
function cleanRecordId(recordId: RecordId | string): string {
  const idString = String(recordId);
  return idString.split(':')[1] || idString;
}

// === TIPOS PARA LA BASE DE DATOS ===
type SessionRow = {
  id?: RecordId | string;
  userId: string; // ✅ CORREGIDO: session table usa string para userId
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
  userId: string; // ✅ CORREGIDO: session table usa string para userId
  caseSlug: CaseSlug;
  level: CompetencyLevel;
  attemptNumber: number;
  status: string;
  startTime: Date;
  passed: boolean;
};

// ✅ Nuevo tipo para el progreso del usuario
type UserProgressRow = {
  id?: RecordId | string;
  userId: RecordId | string; // ✅ user_progress table usa RecordId para userId
  caseSlug: CaseSlug;
  currentLevel: CompetencyLevel;
  highestLevelCompleted?: CompetencyLevel | null;
  attemptNumberInCurrentLevel: number;
  lastUpdated?: Date | string;
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
 * ✅ Crea una nueva sesión de simulación de manera inteligente.
 * Lee el progreso del usuario para determinar el número de intento correcto.
 */
export async function createSession(
  userId: string,
  caseSlug: string,
  currentLevel: CompetencyLevel
): Promise<ISimulationSession> {
  const userProgress = await getUserProgress(userId, caseSlug as CaseSlug);
  const attemptNumber = (userProgress?.attemptNumberInCurrentLevel || 0) + 1;

  // ✅ CORRECCIÓN: db.create espera un objeto Date, no un string ISO.
  const [createdSession] = await db.create<SessionRow>("session", {
    userId,
    caseSlug: caseSlug as CaseSlug,
    level: currentLevel,
    attemptNumber: attemptNumber,
    status: 'in_progress',
    // --- LA CORRECCIÓN CLAVE ---
    startTime: new Date(), // Pasamos el objeto Date directamente
    // --- FIN DE LA CORRECCIÓN ---
    passed: false,
  });

  await updateUserProgress(
    userId, 
    caseSlug as CaseSlug, 
    currentLevel, 
    userProgress?.highestLevelCompleted || null, 
    attemptNumber
  );
  
  const sessionId = String(createdSession.id.id);

  return {
    id: sessionId,
    userId: createdSession.userId,
    case: createdSession.caseSlug,
    level: createdSession.level,
    attemptNumber: createdSession.attemptNumber,
    startTime: new Date(createdSession.startTime),
    conversationHistory: [],
    passed: createdSession.passed,
  };
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

    // ❷ CRÍTICO: Query robusta para mensajes que maneja ambos formatos
    const sessionRecordId = new RecordId('session', sessionId);
    const messagesQuery = `
      SELECT * FROM message 
      WHERE (sessionId = $sessionString OR sessionId = $sessionRecordId OR record::id(sessionId) = $sessionId)
      ORDER BY timestamp ASC
    `;
    
    logger.debug('Consultando mensajes para sesión', { 
      sessionId, 
      sessionRecordId: sessionRecordId.toString() 
    });
    
    const messagesResponse = await db.query<[MessageRow[]]>(messagesQuery, {
      sessionId: sessionId,
      sessionString: sessionId,
      sessionRecordId: sessionRecordId
    });

    const rawMessages = messagesResponse[0] || [];

    logger.debug('Mensajes encontrados raw', { 
      count: rawMessages.length,
      firstMessage: rawMessages[0] ? {
        id: rawMessages[0].id,
        sender: rawMessages[0].sender,
        content: rawMessages[0].content?.substring(0, 50) + '...',
        sessionId: rawMessages[0].sessionId
      } : null
    });

    const messages: IConversationMessage[] = rawMessages.map((m: MessageRow) => ({
      sender: m.sender,
      content: String(m.content),
      timestamp: parseDate(m.timestamp),
    }));

    logger.success('Sesión recuperada', { 
      sessionId, 
      messageCount: messages.length,
      messages: messages.map(m => ({ 
        sender: m.sender, 
        content: m.content.substring(0, 30) + '...' 
      }))
    });

    return {
      id: sessionId,
      userId: String(rawSession.userId), // ✅ CORREGIDO: userId ya es string, no necesita limpieza
      case: rawSession.caseSlug,
      level: rawSession.level,
      attemptNumber: Number(rawSession.attemptNumber),
      startTime: parseDate(rawSession.startTime),
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
    // ❃ Usar helper DRY para obtener RecordId
    const sessionRecordId = await findSessionRecordId(sessionId);
    
    logger.debug('Sesión encontrada para mensaje', { 
      sessionId, 
      sessionRecordId: sessionRecordId.toString() 
    });

    // ❼ En el futuro, esto podría ir en una transacción
    const createdMessage = await db.create<MessageRow>("message", {
      sessionId: sessionRecordId,
      sender: msg.sender,
      content: msg.content,
      timestamp: now,
    });

    // ✅ Manejo seguro de tipos con casting explícito
    let messageId: string = 'unknown';
    try {
      if (Array.isArray(createdMessage) && createdMessage.length > 0) {
        const firstMessage = createdMessage[0] as any;
        messageId = firstMessage?.id ? String(firstMessage.id) : 'unknown';
      } else if (createdMessage) {
        const singleMessage = createdMessage as any;
        messageId = singleMessage?.id ? String(singleMessage.id) : 'unknown';
      }
    } catch (e) {
      // Silently handle type issues
      messageId = 'unknown';
    }

    logger.success('Mensaje añadido exitosamente', { 
      sessionId,
      messageId
    });

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
    // ❃ Usar helper DRY
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
      endTime: new Date(),
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

export async function getCasesForUser(userId: string): Promise<ICase[]> {
  try {
    const userRecordId = new RecordId('user', userId);
    
    // Primero, obtenemos el progreso del usuario para saber qué casos ha jugado
    const progressQuery = `SELECT * FROM user_progress WHERE userId = $user FETCH case;`;
    const [progressData] = await db.query(progressQuery, { user: userRecordId });

    // Luego, obtenemos la lista completa de todos los casos disponibles
    const allCases = await db.select<ICase>('case');

    // Ahora, combinamos las dos listas
    const formattedCases = allCases.map(caseInfo => {
      // Buscamos si el usuario tiene un progreso guardado para este caso
      const progressForThisCase = (progressData as any[])?.find(p => p.caseSlug === caseInfo.slug);
      
      // --- INICIO DE LA CORRECCIÓN CLAVE ---
      // Limpiamos el ID complejo de SurrealDB a un string simple y limpio.
      const cleanId = String(caseInfo.id).replace(/case:|⟨|⟩/g, '');
      // --- FIN DE LA CORRECCIÓN CLAVE ---

      return {
        ...caseInfo,
        id: cleanId, // Enviamos el ID limpio al frontend
        currentLevel: progressForThisCase?.currentLevel ?? CompetencyLevel.BRONCE,
        attempts: progressForThisCase ? `1 de 3` : '0 de 3', 
        progress: progressForThisCase ? 33 : 0,
        available: true, 
      };
    });

    logger.success(`Casos personalizados obtenidos para el usuario ${userId}`, { count: formattedCases.length });
    return formattedCases;

  } catch (error) {
    logger.error(`Error al obtener los casos para el usuario ${userId}`, error);
    return [];
  }
}

// ✅ FUNCIÓN CORREGIDA - Maneja tanto string como RecordId para retrocompatibilidad
export async function getActiveSessionsForUser(userId: string): Promise<ISimulationSession[]> {
  try {
    // Como createSession guarda userId como string simple, buscamos igual
    const query = `SELECT * FROM session WHERE userId = $userId AND status = 'in_progress';`;
    
    const [activeSessions] = await db.query<[SessionRow[]]>(query, { 
      userId: userId // <- Buscar "user123" directamente
    });

    if (!activeSessions || activeSessions.length === 0) {
      logger.info(`No se encontraron sesiones activas para el usuario ${userId}`);
      return [];
    }

    const formattedSessions = activeSessions.map(session => {
      const sessionId = (typeof session.id === 'object' && 'id' in session.id) 
        ? String((session.id as RecordId).id) 
        : String(session.id);
        
      return {
        id: sessionId,
        userId: String(session.userId), // <- Ya es string, no necesita split
        case: session.caseSlug,
        level: session.level,
        attemptNumber: session.attemptNumber,
        startTime: new Date(session.startTime as string),
        passed: session.passed,
        conversationHistory: [],
      };
    });

    logger.success(`Se encontraron ${formattedSessions.length} sesiones activas para el usuario ${userId}`);
    return formattedSessions;

  } catch (error) {
    logger.error(`Error al obtener las sesiones activas para el usuario ${userId}`, error);
    return [];
  }
}

export async function getSessionHistoryForUser(userId: string): Promise<ISimulationSession[]> {
  try {
    const userRecordId = new RecordId('user', userId);
    const query = `SELECT * FROM session WHERE userId = $user AND status = 'completed' ORDER BY startTime DESC;`;

    const [completedSessions] = await db.query<[SessionRow[]]>(query, { user: userRecordId });

    if (!completedSessions || completedSessions.length === 0) {
      logger.info(`No se encontró historial de sesiones para el usuario ${userId}`);
      return [];
    }

    const formattedSessions = completedSessions.map(session => {
      // --- INICIO DE LA CORRECCIÓN ---
      const sessionId = (session.id && typeof session.id === 'object' && 'id' in session.id) 
        ? String((session.id as RecordId).id) 
        : '';
      // --- FIN DE LA CORRECCIÓN ---

      return {
        id: sessionId,
        userId: String(session.userId).split(':')[1],
        case: session.caseSlug,
        level: session.level,
        attemptNumber: session.attemptNumber,
        startTime: new Date(session.startTime as string),
        endTime: session.endTime ? new Date(session.endTime as string) : undefined,
        passed: session.passed,
        conversationHistory: [],
      };
    }).filter(session => session.id !== ''); // Filtramos cualquier sesión con ID inválido

    logger.success(`Se encontró historial de ${formattedSessions.length} sesiones para el usuario ${userId}`);
    return formattedSessions;

  } catch (error) {
    logger.error(`Error al obtener el historial de sesiones para el usuario ${userId}`, error);
    return [];
  }
}

export async function createGrowthTasks(userId: string, sessionId: string, recommendations: string[]) {
  const userRecordId = new RecordId('user', userId);
  const sessionRecordId = new RecordId('session', sessionId);

  for (const desc of recommendations) {
    await db.create('growth_tasks', {
      userId: userRecordId,
      sourceSessionId: sessionRecordId,
      description: desc,
      completed: false,
    });
  }
  logger.success(`${recommendations.length} tareas de crecimiento creadas para el usuario ${userId}`);
}

/**
 * Obtiene el plan de crecimiento (tareas pendientes y completadas) para un usuario.
 */
export async function getGrowthPlanForUser(userId: string) {
  const userRecordId = new RecordId('user', userId);
  const query = 'SELECT * FROM growth_tasks WHERE userId = $user ORDER BY createdAt DESC;';
  const [tasks] = await db.query(query, { user: userRecordId });
  return tasks;
}

/**
 * Cambia el estado de una tarea (completada / no completada).
 */
export async function toggleGrowthTask(taskId: string) {
  // Obtenemos el estado actual
  const taskRecord = await db.select(`growth_tasks:${taskId}`);
  const isCompleted = (taskRecord as any)?.completed || false;
  // Lo invertimos
  const updatedTask = await db.merge(`growth_tasks:${taskId}`, { completed: !isCompleted });
  return updatedTask;
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
    // --- INICIO DE LA CORRECCIÓN CLAVE ---
    // Esta consulta ahora usa la sintaxis correcta de SurrealQL para unir las tablas.
    // FETCH competency expande los datos de la tabla relacionada.
    const query = `
      SELECT
        competency.name as competencyName,
        competency.slug as competencySlug,
        level,
        description as indicator
      FROM competency_progression
      WHERE level = $level
      FETCH competency;
    `;
    // --- FIN DE LA CORRECCIÓN CLAVE ---

    const [rubric] = await db.query(query, { level });
    
    logger.success(`Rúbrica obtenida para el nivel ${level}`, { count: (rubric as any[]).length });
    return rubric as any[];

  } catch (error) {
    logger.error(`Error al obtener la rúbrica para el nivel ${level}`, error);
    return [];
  }
}
/**
 * ✅ Obtiene el progreso actual de un usuario para un caso específico.
 */
export async function getUserProgress(userId: string, caseSlug: CaseSlug): Promise<UserProgressRow | null> {
  try {
    const userRecordId = new RecordId('user', userId);
    const query = 'SELECT * FROM user_progress WHERE userId = $userId AND caseSlug = $caseSlug LIMIT 1;';
    const result = await db.query<[UserProgressRow[]]>(query, { userId: userRecordId, caseSlug });
    
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
 * ✅ Actualiza el progreso de un usuario o crea un nuevo registro si no existe.
 * Ahora también gestiona el número de intentos.
 */
export async function updateUserProgress(
  userId: string,
  caseSlug: CaseSlug,
  newLevel: CompetencyLevel,
  highestLevelCompleted: CompetencyLevel | null,
  attemptNumber: number // ✅ NUEVO PARÁMETRO OBLIGATORIO
) {
  const progressRecord = await getUserProgress(userId, caseSlug);
  const userRecordId = new RecordId('user', userId);

  if (progressRecord) {
    // Si ya existe, lo actualizamos
    const recordId = (progressRecord as any).id;
    await db.merge(recordId, {
      currentLevel: newLevel,
      highestLevelCompleted: highestLevelCompleted,
      attemptNumberInCurrentLevel: attemptNumber, // ✅ ACTUALIZAR INTENTO
      userId: userRecordId, 
    });
    logger.success('Progreso de usuario actualizado', { userId, caseSlug, newLevel, attemptNumber });
  } else {
    // Si no existe, creamos un nuevo registro
    await db.create('user_progress', {
      userId: userRecordId,
      caseSlug,
      currentLevel: newLevel,
      highestLevelCompleted,
      attemptNumberInCurrentLevel: attemptNumber, // ✅ GUARDAR INTENTO
    });
    logger.success('Progreso de usuario creado', { userId, caseSlug, newLevel, attemptNumber });
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