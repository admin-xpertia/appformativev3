import 'dotenv/config';
import { QdrantClient } from "@qdrant/js-client-rest";
import { OpenAIEmbeddings } from "@langchain/openai";
// ✅ OPCIÓN ALTERNATIVA: Usar MarkdownTextSplitter para contenido Markdown
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import * as fs from "fs/promises";
import * as path from "path";

// ✅ CORRECCIÓN: Importar JSON de manera compatible con TypeScript
interface DocumentInfo {
  id: string;
  path: string;
  title?: string;
  description?: string;
}

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
});

const embeddings = new OpenAIEmbeddings({ 
  model: "text-embedding-3-small",
  stripNewLines: true,
});

const collectionName = "procedimientos-aguas-nuevas";

async function loadManifest(): Promise<DocumentInfo[]> {
  try {
    const manifestPath = path.join(__dirname, '..', 'knowledge', 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(manifestContent) as DocumentInfo[];
  } catch (error) {
    console.error("❌ Error cargando manifest.json:", error);
    throw error;
  }
}

async function ensureCollection() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === collectionName);
    
    if (!exists) {
      console.log(`📦 Creando colección: ${collectionName}`);
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: 1536, // Dimensión para text-embedding-3-small
          distance: "Cosine",
        },
      });
    } else {
      console.log(`✅ Colección ${collectionName} ya existe`);
    }
  } catch (error) {
    console.error("❌ Error configurando colección:", error);
    throw error;
  }
}

async function mainMarkdown() {
  try {
    console.log("🚀 Iniciando indexación con MarkdownTextSplitter...");
    
    await ensureCollection();
    const manifest = await loadManifest();
    console.log(`📚 Documentos a procesar: ${manifest.length}`);
    
    const allChunks = [];
    
    for (const docInfo of manifest) {
      const filePath = path.join(__dirname, '..', 'knowledge', docInfo.path);
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        console.log(`📄 Procesando: ${docInfo.path} (${content.length} caracteres)`);

        // ✅ CORRECCIÓN: Usar MarkdownTextSplitter con configuración básica
        const splitter = new MarkdownTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        
        // splitText devuelve string[], necesitamos convertir a Documents
        const textChunks = await splitter.splitText(content);
        
        // Crear objetos Document manualmente
        const documents = textChunks.map((chunk, index) => ({
          pageContent: chunk,
          metadata: {
            source: docInfo.path,
            case_id: docInfo.id,
            title: docInfo.title || docInfo.id,
            description: docInfo.description || '',
            chunk_index: index,
            chunk_size: chunk.length,
            processed_at: new Date().toISOString(),
          }
        }));
        
        allChunks.push(...documents);
        console.log(`  ✂️ Generados ${documents.length} fragmentos`);
        
      } catch (fileError) {
        console.error(`❌ Error procesando ${docInfo.path}:`, fileError);
        continue;
      }
    }

    console.log(`✂️ Total de fragmentos a indexar: ${allChunks.length}`);

    if (allChunks.length === 0) {
      console.log("⚠️ No se encontraron fragmentos para indexar");
      return;
    }

    // Procesar en lotes
    const batchSize = 50;
    let processedCount = 0;

    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batch = allChunks.slice(i, i + batchSize);
      
      console.log(`🔄 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(allChunks.length/batchSize)} (${batch.length} fragmentos)`);
      
      try {
        const contentsToEmbed = batch.map(doc => doc.pageContent);
        const vectors = await embeddings.embedDocuments(contentsToEmbed);

        const points = batch.map((doc, idx) => ({
          id: `${doc.metadata.case_id}-${i + idx}`,
          vector: vectors[idx],
          payload: { 
            text: doc.pageContent,
            source: doc.metadata.source,
            case_id: doc.metadata.case_id,
            title: doc.metadata.title,
            description: doc.metadata.description,
            chunk_index: doc.metadata.chunk_index,
            chunk_size: doc.metadata.chunk_size,
            processed_at: doc.metadata.processed_at,
          }, 
        }));

        await qdrantClient.upsert(collectionName, {
          wait: true,
          points: points,
        });

        processedCount += batch.length;
        console.log(`  ✅ Lote insertado exitosamente (${processedCount}/${allChunks.length})`);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (batchError) {
        console.error(`❌ Error procesando lote ${Math.floor(i/batchSize) + 1}:`, batchError);
        continue;
      }
    }

    const collectionInfo = await qdrantClient.getCollection(collectionName);
    console.log(`🎉 ¡Indexación completada exitosamente!`);
    console.log(`📊 Estadísticas finales:`);
    console.log(`  - Documentos procesados: ${manifest.length}`);
    console.log(`  - Fragmentos generados: ${allChunks.length}`);
    console.log(`  - Vectores en colección: ${collectionInfo.points_count}`);
    console.log(`  - Splitter usado: MarkdownTextSplitter`);

  } catch (error) {
    console.error("❌ Error durante la indexación:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  mainMarkdown().catch(console.error);
}

export { mainMarkdown as embedKnowledgeBaseMarkdown };