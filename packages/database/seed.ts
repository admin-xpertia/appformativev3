// packages/database/seed.ts
import 'dotenv/config';
import { Surreal, RecordId } from 'surrealdb';
import { CaseSlug }          from '@espacio-formativo/types';

const casesToSeed = [
  { slug: CaseSlug.SOBRECONSUMO,       title: 'Sobreconsumo'      },
  { slug: CaseSlug.LA_BOLETA,          title: 'La Boleta'         },
  { slug: CaseSlug.TERMINO_MEDIO,      title: 'Término Medio'     },
  { slug: CaseSlug.PRORRATEO,          title: 'Prorrateo'         },
  { slug: CaseSlug.CORTE_Y_REPOSICION, title: 'Corte y Reposición'},
];

async function main() {
  const db = new Surreal();

  try {
    console.log('🌱 Conectando a SurrealDB Cloud con API Token…');
    await db.connect(process.env.DB_URL!, {
      namespace: process.env.DB_NAMESPACE!,
      database:  process.env.DB_DATABASE!,
      auth:       process.env.DB_TOKEN!,
    });
    console.log('✅ Autenticado. Insertando casos…');

    for (const { slug, title } of casesToSeed) {
      const rid = new RecordId('case', slug);
      console.log(`  -> CREATE ${rid}`); 
      // Pasa el RecordId, así el SDK sabe que "case" es la tabla
      const created = await db.create(rid, { slug, title });
      console.log('  <- Creado:', created);
    }

    console.log('✅ Todas las operaciones de CREATE completadas.');

    // Verificación
    const all = await db.select('case');
    console.log(`🎉 Hay ${all.length} casos en 'case':`);
    console.table(all);

  } catch (e) {
    console.error('❌ Error durante la siembra:', e);
    process.exit(1);
  } finally {
    await db.close();
    console.log('🔌 Conexión cerrada.');
  }
}

main();
