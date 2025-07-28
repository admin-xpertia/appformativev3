// /services/database.service.ts
import { Surreal } from 'surrealdb';
import type { ICase } from '@espacio-formativo/types';

const db = new Surreal();

export async function connectToDB() {
  try {
    console.log('Estableciendo conexión con SurrealDB Cloud…');
    // Usa wss para conexión WebSocket y establece NS y DB en las opciones
    await db.connect(process.env.DB_URL!, {
      namespace: process.env.DB_NAMESPACE!,
      database: process.env.DB_DATABASE!,
      // Autenticación de usuario de sistema (root, namespace o database)
      auth: {
        username: process.env.DB_USER!,
        password: process.env.DB_PASS!,
      },
    });
    // Espera a que la conexión esté lista
    await db.ready;
    console.log('✅ Conexión WebSocket establecida.');
  } catch (e) {
    console.error('❌ ERROR AL ESTABLECER CONEXIÓN:', e);
    throw e;
  }
}

// Consultas de ejemplo
export const getAllCases = async (): Promise<ICase[]> => {
  try {
    return await db.select<ICase>('case');
  } catch (error) {
    console.error('❌ Error al obtener los casos desde la DB:', error);
    return [];
  }
};

export { db };
