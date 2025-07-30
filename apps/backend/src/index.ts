// En apps/backend/src/index.ts

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';

// --- INICIO DE LA CORRECCIÓN ---
// Importamos TODO el módulo como un solo objeto llamado 'databaseService'
import * as databaseService from './services/database.service';
// --- FIN DE LA CORRECCIÓN ---

import { generateBriefing } from './agents/introduction.chain';
import type { IFeedbackReport } from '@espacio-formativo/types';
import { simulationApp } from './flows/simulation.flow';

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: '*' });

// 1) Casos
fastify.get('/api/cases', async (_req, reply) => {
  fastify.log.info('GET /api/cases');
  try {
    const cases = await databaseService.getAllCases();
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
  const caseSlug = caseId;
  
  fastify.log.info(`POST /api/briefing for ${caseSlug}, level ${level}`);

  // DEBUG: Mantener para verificar que llegan los datos correctos
  console.log('DEBUG - caseSlug recibido:', JSON.stringify(caseSlug));
  console.log('DEBUG - level recibido:', JSON.stringify(level));

  // 1. Obtener la info del nivel desde la BD
  const levelInfo = await databaseService.getLevelInfo(caseSlug, level);

  if (!levelInfo) {
    reply.code(404);
    return { error: `No se encontró información para el nivel '${level}' del caso '${caseSlug}'.` };
  }

  // --- INICIO DE LA CORRECCIÓN CLAVE ---
  // 2. Obtención de la información del caso (incluyendo el título)
  const caseInfo = await databaseService.getCaseBySlug(caseSlug);

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
    caseInfo.title,
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
    
    const newSession = await databaseService.createSession(userId, caseSlug);
    
    console.log(`✅ Sesión creada exitosamente con ID: ${newSession.id}`);
    console.log(`📊 Datos de la sesión:`, {
      sessionId: newSession.id,
      case: newSession.case,
      level: newSession.level,
      startTime: newSession.startTime
    });

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
    const data = await databaseService.getSession(request.params.sessionId);
    return data;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'No se pudo obtener la sesión' });
  }
});

// 6) Añadir turno e invocar el grafo de simulación (CORREGIDO PARA EVITAR BUCLES)
fastify.post<{
  Params: { sessionId: string };
  Body: { content: string };
}>('/api/session/:sessionId/turn', async (request, reply) => {
  const { sessionId } = request.params;
  const { content } = request.body;
  fastify.log.info(`POST /api/session/${sessionId}/turn`, { content });

  try {
    // 1️⃣ Añadir mensaje del usuario a la BD
    await databaseService.appendMessage(sessionId, { sender: 'user', content });

    // 2️⃣ Obtener información actual de la sesión
    const currentSession = await databaseService.getSession(sessionId);
    const caseInfo = await databaseService.getCaseBySlug(currentSession.case);
    const levelInfo = await databaseService.getLevelInfo(currentSession.case, currentSession.level);

    if (!caseInfo || !levelInfo) {
      reply.code(404);
      return { error: "No se encontró la información del caso o nivel para esta sesión." };
    }

    // 3️⃣ Preparar estado inicial del grafo
    const graphState = {
      sessionId: currentSession.id,
      caseInfo,
      levelInfo,
      conversationHistory: currentSession.conversationHistory,
      simulationComplete: false, // 🔥 NUEVO: Control de terminación
    };

    console.log(`🚀 Invocando grafo con ${graphState.conversationHistory.length} mensajes en historial`);

    // 4️⃣ Ejecutar el grafo 
    const finalState = await simulationApp.invoke(graphState);

    console.log(`✅ Grafo completado. Simulación completa: ${finalState.simulationComplete}`);
    console.log(`🎯 Decisión supervisor: ${finalState.supervisorDecision}`);

    // 5️⃣ Encontrar la respuesta del AI (último mensaje del AI en el estado final)
    const aiMessages = finalState.conversationHistory.filter(msg => msg.sender === 'ai');
    const aiResponse = aiMessages[aiMessages.length - 1];

    if (!aiResponse) {
      throw new Error("No se generó respuesta del AI en el grafo");
    }

    // 6️⃣ Guardar la respuesta del AI en la BD
    await databaseService.appendMessage(sessionId, aiResponse);

    console.log(`💾 Respuesta del AI guardada: "${aiResponse.content.substring(0, 50)}..."`);

    // 7️⃣ Determinar la respuesta según el estado de la simulación
    if (finalState.simulationComplete) {
      console.log(`🏁 Simulación completada para sesión ${sessionId}`);
      
      return {
        status: 'completed', // 🔥 NUEVO: Indica al frontend que debe ir a evaluación
        ai_message: aiResponse,
        next_action: 'evaluation', // 🔥 NUEVO: Acción específica para el frontend
        message: 'La simulación ha finalizado. Proceder a evaluación.',
        total_exchanges: finalState.conversationHistory.filter(msg => msg.sender === 'user').length
      };
    } else {
      console.log(`⏳ Simulación continúa para sesión ${sessionId}`);
      
      return {
        status: 'in_progress', // Conversación continúa
        ai_message: aiResponse,
        next_action: 'continue', // 🔥 NUEVO: El usuario puede seguir conversando
        message: 'La simulación continúa. Puedes enviar otro mensaje.'
      };
    }

  } catch (err) {
    console.error(`❌ Error procesando turno para sesión ${sessionId}:`, err);
    fastify.log.error(err);
    
    // 🔥 MEJORADO: Error handling específico con type guards
    const error = err as Error;
    
    if (error.name === 'GraphRecursionError') {
      return reply.status(500).send({ 
        error: 'El grafo alcanzó el límite de recursión. La simulación se detuvo.',
        code: 'RECURSION_LIMIT',
        next_action: 'evaluation' // Forzar evaluación en caso de error
      });
    }
    
    return reply.status(500).send({ 
      error: 'No se pudo procesar el turno',
      details: error.message || 'Error desconocido'
    });
  }
});

// 🔥 NUEVO ENDPOINT: Finalizar simulación manualmente
fastify.post<{
  Params: { sessionId: string };
}>('/api/session/:sessionId/finalize', async (request, reply) => {
  const { sessionId } = request.params;
  fastify.log.info(`POST /api/session/${sessionId}/finalize`);

  try {
    const currentSession = await databaseService.getSession(sessionId);
    
    // Generar feedback básico (esto se puede mejorar con IA)
    const mockFeedback = {
      generalCommentary: 'Simulación completada manualmente por el usuario.',
      competencyFeedback: [
        {
          competency: 'comunicacion-efectiva' as any,
          achievedLevel: 'BRONCE' as any,
          strengths: ['Participación activa'],
          areasForImprovement: ['Continuar practicando'],
          justification: 'Nivel básico demostrado'
        }
      ],
      recommendations: ['Continuar practicando para mejorar habilidades']
    };

    await databaseService.finalizeSession(sessionId, mockFeedback);

    return {
      status: 'finalized',
      feedback: mockFeedback,
      message: 'Simulación finalizada exitosamente.',
      next_action: 'evaluation'
    };

  } catch (err) {
    console.error(`❌ Error al finalizar sesión ${sessionId}:`, err);
    fastify.log.error(err);
    
    const error = err as Error;
    return reply.status(500).send({ 
      error: 'No se pudo finalizar la simulación',
      details: error.message || 'Error desconocido'
    });
  }
});


// Levantar servidor
const start = async () => {
  await databaseService.connectToDB();
  const port = Number(process.env.PORT) || 3001;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`🚀 Servidor escuchando en puerto ${port}`);
};

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
