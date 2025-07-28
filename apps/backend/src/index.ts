// src/index.ts
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
} from './services/database.service';
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
    { competency: 'regulaciones',     progress: 45, level: 'bronce' },
    { competency: 'resolucion-problemas', progress: 90, level: 'oro' },
    { competency: 'comunicacion-efectiva', progress: 60, level: 'plata' },
    { competency: 'integridad',         progress: 85, level: 'oro' },
  ];
});

// 3) Iniciar sesión
fastify.post<{
  Body: { userId: string; caseSlug: string };
}>('/api/session/start', async (request, reply) => {
  fastify.log.info('POST /api/session/start', request.body);
  try {
    const { userId, caseSlug } = request.body;
    const session = await createSession(userId, caseSlug);
    return session;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'No se pudo crear la sesión' });
  }
});

// 4) Obtener sesión + mensajes
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

// 5) Añadir turno y devolver conversación actualizada
fastify.post<{
  Params: { sessionId: string };
  Body: { content: string };
}>('/api/session/:sessionId/turn', async (request, reply) => {
  const { sessionId } = request.params;
  const { content }   = request.body;
  fastify.log.info(`POST /api/session/${sessionId}/turn`, content);
  try {
    // 1) Inserta mensaje del usuario
    await appendMessage(sessionId, { sender: 'user', content });
    // 2) (Aquí iría la llamada al Agente Simulador OpenAI y appendMessage AI)
    //    Por ahora devolvemos solo la conversación
    const data = await getSession(sessionId);
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'No se pudo procesar el turno' });
  }
});

// 6) Finalizar y guardar feedback
fastify.post<{
  Params: { sessionId: string };
  Body: IFeedbackReport;
}>('/api/session/:sessionId/finalize', async (request, reply) => {
  const { sessionId } = request.params;
  const feedback      = request.body;
  fastify.log.info(`POST /api/session/${sessionId}/finalize`, feedback);
  try {
    const fb = await finalizeSession(sessionId, feedback);
    return fb;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'No se pudo finalizar la sesión' });
  }
});

// 7) Obtener feedback final
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
