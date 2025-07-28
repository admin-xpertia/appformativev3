import { Surreal } from 'surrealdb';

const db = new Surreal();

async function connectToDB() {
  try {
    const dbUrl = process.env.DB_URL;
    const dbToken = process.env.DB_TOKEN; // ¡Usando el token!
    const dbNs = process.env.DB_NAMESPACE;
    const dbName = process.env.DB_DATABASE;

    if (!dbUrl || !dbToken || !dbNs || !dbName) {
        throw new Error("Faltan variables de entorno para la base de datos (URL, TOKEN, NS, DB).");
    }

    console.log("Intentando conectar a SurrealDB Cloud usando autenticación por token...");

    // El método de conexión correcto usando un token
    await db.connect(dbUrl, {
      namespace: dbNs,
      database: dbName,
      auth: dbToken, // Pasamos el token directamente aquí
    });

    console.log(`✅ ¡Conexión y autenticación exitosas con SurrealDB Cloud!`);

  } catch (e) {
    console.error('❌ ERROR AL CONECTAR A SURREALDB CLOUD:', e);
  }
}

connectToDB();

export { db };