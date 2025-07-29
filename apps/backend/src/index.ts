// En apps/backend/src/index.ts

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  connectToDB,
  getAllCases,
  createSession,
  getSession,
  appendMessage,
  finalizeSession,
  getFeedback,
  getLevelInfo,
  getCaseBySlug,  // ← NUEVA FUNCIÓN IMPORTADA
} from './services/database.service';
import { generateBriefing } from './agents/introduction.chain';
import type { IFeedbackReport } from '@espacio-formativo/types';

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: '*' });

// 1) Casos
fastify.get('/api/cases', async (_req, reply) => {
  fastify.log.info('GET /api/cases');
  try {
    const cases = await getAllCases();
    return cases;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'No se pudieron obtener los casos' });
  }
});

// 2) Progreso de usuario (mock por ahora)
fastify.get<{
  Params: { userId: string };
}>('/api/user/:userId/progress', async (request) => {
  fastify.log.info(`GET /api/user/${request.params.userId}/progress`);
  return [
    { competency: 'enfoque-cliente', progress: 75, level: 'plata' },
    { competency: 'regulaciones', progress: 45, level: 'bronce' },
    { competency: 'resolucion-problemas', progress: 90, level: 'oro' },
    { competency: 'comunicacion-efectiva', progress: 60, level: 'plata' },
    { competency: 'integridad', progress: 85, level: 'oro' },
  ];
});

// 3) Briefing - CORREGIDO PARA OBTENER CASE TITLE
fastify.post<{
  Body: { caseId: string; level: string };
}>('/api/briefing', async (request, reply) => {
  const { caseId, level } = request.body;
  // Renombramos caseId a caseSlug para mayor claridad interna
  const caseSlug = caseId;
  
  fastify.log.info(`POST /api/briefing for ${caseSlug}, level ${level}`);

  // DEBUG: Mantener para verificar que llegan los datos correctos
  console.log('DEBUG - caseSlug recibido:', JSON.stringify(caseSlug));
  console.log('DEBUG - level recibido:', JSON.stringify(level));

  // 1. Obtener la info del nivel desde la BD
  const levelInfo = await getLevelInfo(caseSlug, level);

  if (!levelInfo) {
    reply.code(404);
    return { error: `No se encontró información para el nivel '${level}' del caso '${caseSlug}'.` };
  }

  // --- INICIO DE LA CORRECCIÓN CLAVE ---
  // 2. Ahora, obtenemos la información del caso (incluyendo el título) usando el slug.
  const caseInfo = await getCaseBySlug(caseSlug);

  if (!caseInfo) {
    reply.code(404);
    return { error: `No se encontró el caso con el slug '${caseSlug}'.` };
  }

  console.log('✅ DATOS COMPLETOS - caseInfo.title:', caseInfo.title);
  console.log('✅ DATOS COMPLETOS - levelInfo.level:', levelInfo.level);
  console.log('✅ DATOS COMPLETOS - levelInfo.objectives:', levelInfo.objectives);
  // --- FIN DE LA CORRECCIÓN CLAVE ---

  // 3. Llamar a nuestro agente de LangChain con los datos completos
  const briefingText = await generateBriefing(
    caseInfo.title,    // ¡Ahora tenemos el título correcto!
    levelInfo.level,
    levelInfo.objectives
  );

  return { briefing: briefingText };
});

// 4) Iniciar sesión - MEJORADO
fastify.post<{
  Body: { userId: string; caseSlug: string };
}>('/api/session/start', async (request, reply) => {
  fastify.log.info('POST /api/session/start', request.body);
  
  const { userId, caseSlug } = request.body;

  // --- VALIDACIONES MEJORADAS ---
  if (!userId || !caseSlug) {
    reply.code(400);
    return { error: 'Faltan userId o caseSlug en la petición.' };
  }

  if (typeof userId !== 'string' || typeof caseSlug !== 'string') {
    reply.code(400);
    return { error: 'userId y caseSlug deben ser strings.' };
  }

  if (userId.trim() === '' || caseSlug.trim() === '') {
    reply.code(400);
    return { error: 'userId y caseSlug no pueden estar vacíos.' };
  }
  // --- FIN VALIDACIONES ---

  try {
    console.log(`🎯 Creando nueva sesión para el caso: ${caseSlug}, usuario: ${userId}`);
    
    // Crear la nueva sesión
    const newSession = await createSession(userId, caseSlug);
    
    console.log(`✅ Sesión creada exitosamente con ID: ${newSession.id}`);
    console.log(`📊 Datos de la sesión:`, {
      sessionId: newSession.id,
      case: newSession.case,
      level: newSession.level,
      startTime: newSession.startTime
    });

    // Devolver la sesión recién creada al frontend
    return newSession;

  } catch (error) {
    console.error("❌ Error al crear la sesión:", error);
    fastify.log.error(error);
    reply.code(500);
    return { error: 'Hubo un problema al crear la sesión en la base de datos.' };
  }
});

// 5) Obtener sesión + mensajes
fastify.get<{
  Params: { sessionId: string };
}>('/api/session/:sessionId', async (request, reply) => {
  fastify.log.info(`GET /api/session/${request.params.sessionId}`);
  try {
    const data = await getSession(request.params.sessionId);
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'No se pudo obtener la sesión' });
  }
});

// 6) Añadir turno y devolver conversación actualizada
fastify.post<{
  Params: { sessionId: string };
  Body: { content: string };
}>('/api/session/:sessionId/turn', async (request, reply) => {
  const { sessionId } = request.params;
  const { content } = request.body;
  fastify.log.info(`POST /api/session/${sessionId}/turn`, content);
  try {
    await appendMessage(sessionId, { sender: 'user', content });
    // TODO: integrar agente simulador aquí
    const data = await getSession(sessionId);
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'No se pudo procesar el turno' });
  }
});

// 7) Finalizar y guardar feedback
fastify.post<{
  Params: { sessionId: string };
  Body: IFeedbackReport;
}>('/api/session/:sessionId/finalize', async (request, reply) => {
  const { sessionId } = request.params;
  const feedback = request.body;
  fastify.log.info(`POST /api/session/${sessionId}/finalize`, feedback);
  try {
    const fb = await finalizeSession(sessionId, feedback);
    return fb;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'No se pudo finalizar la sesión' });
  }
});

// 8) Obtener feedback final
fastify.get<{
  Params: { sessionId: string };
}>('/api/session/:sessionId/feedback', async (request, reply) => {
  const { sessionId } = request.params;
  fastify.log.info(`GET /api/session/${sessionId}/feedback`);
  try {
    const fb = await getFeedback(sessionId);
    return fb ?? reply.status(404).send({ error: 'Feedback no encontrado' });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Error al obtener feedback' });
  }
});

// Levantar servidor
const start = async () => {
  await connectToDB();
  const port = Number(process.env.PORT) || 3001;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`🚀 Servidor escuchando en puerto ${port}`);
};

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});