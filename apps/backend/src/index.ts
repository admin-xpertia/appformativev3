import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { CaseSlug } from '@espacio-formativo/types'; // ¡Importando desde nuestro paquete compartido!
import './services/database.service';

const fastify = Fastify({
  logger: true // Activa logs para ver qué está pasando
});

// Registra el plugin de CORS para permitir peticiones desde el frontend
fastify.register(cors, {
  origin: "*", // En producción, esto debería ser la URL de tu frontend
});

// Nuestra primera ruta de API
// Debajo de la ruta /api/hello, añade esto:

// Endpoint para obtener todos los casos de simulación
fastify.get('/api/cases', async (request, reply) => {
  // En el futuro, esto vendrá de SurrealDB. Por ahora, es un mock.
  const mockCases = [
    { id: "sobreconsumo", title: "Sobreconsumo", currentLevel: "plata", attempts: "2 de 3", progress: 67, available: true, lastAttempt: "15 Nov 2024" },
    { id: "la-boleta", title: "La Boleta", currentLevel: "bronce", attempts: "1 de 3", progress: 33, available: true, lastAttempt: "12 Nov 2024" },
    // ... puedes añadir el resto de los casos aquí
  ];
  return mockCases;
});

// Endpoint para obtener el progreso del usuario en las competencias
fastify.get('/api/user/:userId/progress', async (request, reply) => {
  // El :userId lo hará dinámico en el futuro. Por ahora, devolvemos siempre lo mismo.
  const mockCompetencyProgress = [
    { competency: "enfoque-cliente", progress: 75, level: "plata" },
    { competency: "regulaciones", progress: 45, level: "bronce" },
    { competency: "resolucion-problemas", progress: 90, level: "oro" },
    { competency: "comunicacion-efectiva", progress: 60, level: "plata" },
    { competency: "integridad", progress: 85, level: "oro" },
  ];
  return mockCompetencyProgress;
});

// Función para iniciar el servidor
const start = async () => {
  try {
    await fastify.listen({ port: 3001 }); // El backend correrá en el puerto 3001
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();