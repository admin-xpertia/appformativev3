import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectToDB, getAllCases } from './services/database.service';

const fastify = Fastify({
  logger: true,              // Activa logs detallados
});

// Habilitar CORS para todas las rutas
fastify.register(cors, {
  origin: '*',               // En producción restringe a tu frontend
});

// --- Rutas --- //

// Obtener todos los casos
fastify.get('/api/cases', async (request, reply) => {
  fastify.log.info('GET /api/cases');
  try {
    const cases = await getAllCases();
    return cases;
  } catch (err) {
    fastify.log.error('Error al obtener casos:', err);
    return reply.status(500).send({ error: 'No se pudieron obtener los casos' });
  }
});

// Obtener progreso de un usuario
fastify.get<{
  Params: { userId: string };
}>('/api/user/:userId/progress', async (request, reply) => {
  const { userId } = request.params;
  fastify.log.info(`GET /api/user/${userId}/progress`);
  // Datos simulados por ahora
  const mockCompetencyProgress = [
    { competency: 'enfoque-cliente',       progress: 75, level: 'plata' },
    { competency: 'regulaciones',           progress: 45, level: 'bronce' },
    { competency: 'resolucion-problemas',   progress: 90, level: 'oro' },
    { competency: 'comunicacion-efectiva',  progress: 60, level: 'plata' },
    { competency: 'integridad',             progress: 85, level: 'oro' },
  ];
  return mockCompetencyProgress;
});

// --- Inicio del servidor --- //
const start = async () => {
  try {
    // 1) Conectarse + autenticar (credenciales en connectToDB)
    await connectToDB();
    fastify.log.info('✅ Base de datos conectada y autenticada');

    // 2) Arrancar Fastify
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`🚀 Servidor listo en puerto ${port}`);
  } catch (err) {
    fastify.log.error('Error al arrancar el servidor:', err);
    process.exit(1);
  }
};

start();
