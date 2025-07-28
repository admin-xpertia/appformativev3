// packages/database/createSchema.ts
import 'dotenv/config';
import { Surreal } from 'surrealdb';

async function main() {
  const db = new Surreal();
  await db.connect(process.env.DB_URL!, {
    namespace: process.env.DB_NAMESPACE!,
    database:  process.env.DB_DATABASE!,
    auth:       process.env.DB_TOKEN!,
  });
  await db.ready;

  console.log('🛠  Definiendo esquema…');

  await db.query(`
    DEFINE TABLE session SCHEMAFULL;
      DEFINE FIELD userId        ON session TYPE string;
      DEFINE FIELD caseSlug      ON session TYPE string;
      DEFINE FIELD level         ON session TYPE string;
      DEFINE FIELD attemptNumber ON session TYPE number;
      DEFINE FIELD status        ON session TYPE string;
      DEFINE FIELD startTime     ON session TYPE datetime;
      DEFINE FIELD endTime       ON session TYPE datetime;
  `);

  await db.query(`
    DEFINE TABLE message SCHEMAFULL;
      DEFINE FIELD sessionId ON message TYPE record;
      DEFINE FIELD sender    ON message TYPE string;
      DEFINE FIELD content   ON message TYPE string;
      DEFINE FIELD timestamp ON message TYPE datetime;
  `);

  await db.query(`
    DEFINE TABLE feedback SCHEMAFULL;
      DEFINE FIELD sessionId         ON feedback TYPE record;
      DEFINE FIELD generalCommentary ON feedback TYPE string;
      DEFINE FIELD competencyFeedback ON feedback TYPE array;
      DEFINE FIELD recommendations    ON feedback TYPE array;
  `);

  console.log('✅ Esquema creado.');
  await db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
