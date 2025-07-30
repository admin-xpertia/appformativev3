import * as dotenv from 'dotenv';
import * as path from "path";

// ✅ CARGAR .ENV DESDE LA UBICACIÓN CORRECTA
// Desde apps/backend/src/scripts/ necesitamos ir a apps/backend/.env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
import { QdrantClient } from "@qdrant/js-client-rest";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import * as fs from "fs/promises";


interface DocumentInfo {
  id: string;
  path: string;
  title?: string;
  description?: string;
}

// ✅ CONFIGURACIÓN MEJORADA PARA QDRANT CLOUD
function createQdrantClient() {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  
  if (!url || !apiKey) {
    throw new Error(`
❌ Variables de entorno faltantes para Qdrant Cloud:
   - QDRANT_URL: ${url ? '✅ Configurada' : '❌ Faltante'}
   - QDRANT_API_KEY: ${apiKey ? '✅ Configurada' : '❌ Faltante'}

📋 Ejemplo de configuración en .env:
QDRANT_URL=https://tu-cluster-id.eu-central.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=tu-api-key-aqui
`);
  }

  console.log(`🔗 Conectando a Qdrant Cloud: ${url}`);
  
  // Configuración específica para Qdrant Cloud
  return new QdrantClient({
    url: url,
    apiKey: apiKey,
    // ✅ CONFIGURACIONES ROBUSTAS PARA QDRANT CLOUD
    timeout: 60000, // 60 segundos timeout (aumentado)
    checkCompatibility: false, // Desactivar check de compatibilidad
    // Configuraciones adicionales para conexión estable
    port: undefined, // Dejar que tome el puerto de la URL
    https: true, // Forzar HTTPS para Qdrant Cloud
  });
}

// Crear cliente solo si las variables están disponibles
let qdrantClient: QdrantClient;

try {
  qdrantClient = createQdrantClient();
} catch (error) {
  console.error("❌ Error inicializando cliente Qdrant:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const embeddings = new OpenAIEmbeddings({ 
  model: "text-embedding-3-small",
  stripNewLines: true,
});

const collectionName = "procedimientos-aguas-nuevas";

// ✅ CONTADOR GLOBAL PARA IDs ÚNICOS (NÚMEROS ENTEROS)
let globalPointId = 1;

async function loadManifest(): Promise<{ documents: DocumentInfo[], basePath: string }> {
  try {
    // Buscar manifest.json en diferentes ubicaciones posibles
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'knowledge', 'manifest.json'), // apps/backend/knowledge/
      path.join(__dirname, '..', 'knowledge', 'manifest.json'), // apps/backend/src/knowledge/
      path.join(__dirname, 'knowledge', 'manifest.json'), // apps/backend/src/scripts/knowledge/
    ];
    
    let manifestPath = '';
    let manifestContent = '';
    
    for (const possiblePath of possiblePaths) {
      try {
        manifestContent = await fs.readFile(possiblePath, 'utf-8');
        manifestPath = possiblePath;
        console.log(`✅ Manifest encontrado en: ${manifestPath}`);
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!manifestContent) {
      throw new Error(`No se encontró manifest.json en ninguna de estas ubicaciones:\n${possiblePaths.join('\n')}`);
    }
    
    const documents = JSON.parse(manifestContent) as DocumentInfo[];
    const basePath = path.dirname(manifestPath);
    
    // Validar que los archivos existan
    console.log("🔍 Validando archivos del manifest...");
    const validDocuments = [];
    
    for (const doc of documents) {
      const fullPath = path.join(basePath, doc.path);
      try {
        await fs.access(fullPath);
        validDocuments.push(doc);
        console.log(`  ✅ ${doc.path}`);
      } catch (error) {
        console.log(`  ❌ ${doc.path} - archivo no encontrado`);
        console.log(`     Ruta completa: ${fullPath}`);
        console.log(`     Sugerencia: Verifica el nombre del archivo en manifest.json`);
      }
    }
    
    if (validDocuments.length === 0) {
      throw new Error("No se encontraron archivos válidos para procesar");
    }
    
    if (validDocuments.length < documents.length) {
      console.log(`⚠️ Se encontraron ${documents.length - validDocuments.length} archivos faltantes`);
    }
    
    return { documents: validDocuments, basePath };
  } catch (error) {
    console.error("❌ Error cargando manifest.json:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ✅ FUNCIÓN MEJORADA: Probar conexión a Qdrant
async function testQdrantConnection() {
  try {
    console.log("🔍 Probando conexión a Qdrant Cloud...");
    console.log(`🌐 URL: ${process.env.QDRANT_URL}`);
    console.log(`🔑 API Key configurada: ${process.env.QDRANT_API_KEY ? '✅ Sí' : '❌ No'}`);
    
    // Test simple de conexión
    const collections = await qdrantClient.getCollections();
    console.log(`✅ Conexión exitosa. Colecciones existentes: ${collections.collections.length}`);
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error de conexión a Qdrant:", errorMessage);
    
    // Diagnóstico específico mejorado
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      console.error(`
🔧 DIAGNÓSTICO DEL ERROR - CONEXIÓN FALLIDA:
   - Error de red/conexión con Qdrant Cloud
   - URL actual: ${process.env.QDRANT_URL}
   - Verifica que la URL sea correcta
   - Verifica tu conexión a internet
   - Verifica que el cluster de Qdrant Cloud esté activo
   
📋 Formato correcto para Qdrant Cloud:
   QDRANT_URL=https://tu-cluster-id.region.aws.cloud.qdrant.io:6333
   (NO usar http, SIEMPRE https para Qdrant Cloud)
   
💡 Posibles soluciones:
   1. Verifica que el cluster no esté pausado/dormido
   2. Verifica la región en la URL
   3. Intenta acceder desde el navegador a la URL
`);
    } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
      console.error(`
🔧 DIAGNÓSTICO DEL ERROR - AUTENTICACIÓN:
   - Error de autenticación
   - Verifica que QDRANT_API_KEY esté configurada correctamente
   - Verifica que la API key tenga permisos suficientes
   - API Key length: ${process.env.QDRANT_API_KEY?.length || 0} caracteres
`);
    } else if (errorMessage.includes('timeout')) {
      console.error(`
🔧 DIAGNÓSTICO DEL ERROR - TIMEOUT:
   - La conexión tardó demasiado
   - El cluster puede estar lento o inactivo
   - Intenta nuevamente en unos minutos
`);
    }
    
    return false;
  }
}

async function ensureCollection() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === collectionName);
    
    if (exists) {
      console.log(`🗑️ Eliminando colección existente: ${collectionName}`);
      await qdrantClient.deleteCollection(collectionName);
    }
    
    console.log(`📦 Creando colección: ${collectionName}`);
    
    // ✅ CONFIGURACIÓN ESPECÍFICA PARA QDRANT CLOUD CON VECTORES NOMBRADOS
    await qdrantClient.createCollection(collectionName, {
      vectors: {
        "default": {  // ✅ IMPORTANTE: Vector nombrado para Qdrant Cloud
          size: 1536,
          distance: "Cosine",
        }
      },
      // ✅ CONFIGURACIÓN OPTIMIZADA PARA QDRANT CLOUD
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1,
      write_consistency_factor: 1,
    });
    
    console.log(`✅ Colección ${collectionName} creada exitosamente con vectores nombrados`);
    
  } catch (error) {
    console.error("❌ Error configurando colección:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function main() {
  try {
    console.log("🚀 Iniciando indexación con MarkdownTextSplitter...");
    
    // 1. Verificar variables de entorno
    const requiredVars = ['QDRANT_URL', 'QDRANT_API_KEY', 'OPENAI_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    }
    
    // 2. Probar conexión a Qdrant
    const connectionOk = await testQdrantConnection();
    if (!connectionOk) {
      throw new Error("No se pudo establecer conexión con Qdrant Cloud");
    }
    
    // 3. Configurar colección
    await ensureCollection();
    
    // 4. Cargar documentos
    const { documents: manifest, basePath } = await loadManifest();
    console.log(`📚 Documentos a procesar: ${manifest.length}`);
    
    const allChunks = [];
    
    for (const docInfo of manifest) {
      const filePath = path.join(basePath, docInfo.path);
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Limpiar y validar el contenido antes de procesar
        if (!content || content.trim().length < 50) {
          console.log(`⚠️ Documento ${docInfo.path} demasiado corto o vacío, saltando...`);
          continue;
        }

        // ✅ LIMPIEZA ESPECÍFICA PARA MARKDOWN
        const cleanContent = content
          // Eliminar caracteres de control
          .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
          // Normalizar espacios no separables
          .replace(/\u00a0/g, ' ')
          // Normalizar saltos de línea
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          // Limpiar múltiples espacios pero preservar estructura markdown
          .replace(/[ \t]+/g, ' ')
          // Limpiar múltiples saltos de línea pero preservar párrafos
          .replace(/\n{4,}/g, '\n\n\n')
          // Normalizar títulos markdown (espacios después de #)
          .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
          // Limpiar listas markdown mal formateadas
          .replace(/^[\-\*\+]([^\s])/gm, '- $1')
          .trim();

        console.log(`📄 Procesando: ${docInfo.path} (${cleanContent.length} caracteres)`);

        // ✅ CONFIGURACIÓN OPTIMIZADA PARA MARKDOWN
        const splitter = new MarkdownTextSplitter({
          chunkSize: 1200,        // Aumentado para mejor contexto
          chunkOverlap: 200,      // Overlap moderado
          lengthFunction: (text: string) => text.length,
        });
        
        const textChunks = await splitter.splitText(cleanContent);
        
        // ✅ FILTRADO Y VALIDACIÓN MEJORADA
        const validChunks = textChunks
          .map(chunk => chunk.trim())
          .filter(chunk => {
            // Filtros básicos
            if (!chunk || chunk.length < 30 || chunk.length > 10000) {
              return false;
            }
            
            // Evitar chunks que son solo símbolos o espacios
            if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(chunk)) {
              return false;
            }
            
            // Evitar chunks que son solo números o caracteres especiales
            if (chunk.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '').length < 10) {
              return false;
            }
            
            return true;
          })
          // Limpiar chunks individualmente
          .map(chunk => {
            return chunk
              // Eliminar líneas vacías al inicio y final
              .replace(/^\n+|\n+$/g, '')
              // Normalizar espacios internos
              .replace(/\s+/g, ' ')
              .trim();
          });
        
        if (validChunks.length === 0) {
          console.log(`⚠️ No se generaron chunks válidos para ${docInfo.path}`);
          continue;
        }

        console.log(`  ✂️ Chunks válidos: ${validChunks.length}/${textChunks.length}`);

        // Crear ID limpio para el documento
        const cleanDocId = docInfo.id
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
          .replace(/[^a-zA-Z0-9]/g, '_')   // Solo letras, números y guiones bajos
          .replace(/_+/g, '_')             // Consolidar múltiples guiones bajos
          .replace(/^_|_$/g, '')           // Eliminar guiones bajos al inicio/final
          .substring(0, 50);               // Limitar longitud

        const documents = validChunks.map((chunk, index) => ({
          pageContent: chunk,
          metadata: {
            source: docInfo.path,
            case_id: cleanDocId,
            title: (docInfo.title || docInfo.id).replace(/[^\w\s-]/g, ''), // Limpiar título
            description: (docInfo.description || '').replace(/[^\w\s-]/g, ''), // Limpiar descripción
            chunk_index: index,
            chunk_size: chunk.length,
            processed_at: new Date().toISOString(),
          }
        }));
        
        allChunks.push(...documents);
        console.log(`  ✂️ Generados ${documents.length} fragmentos`);
        
      } catch (fileError) {
        console.error(`❌ Error procesando ${docInfo.path}:`, fileError instanceof Error ? fileError.message : String(fileError));
        continue;
      }
    }

    console.log(`✂️ Total de fragmentos a indexar: ${allChunks.length}`);

    if (allChunks.length === 0) {
      console.log("⚠️ No se encontraron fragmentos para indexar");
      return;
    }

    // ✅ MODO DE PRUEBA: Probar con un solo punto primero
    console.log("🧪 Modo de prueba: Insertando un punto para verificar formato...");
    try {
      const testDoc = allChunks[0];
      console.log("🔍 Generando embedding de prueba...");
      const testVector = await embeddings.embedDocuments([testDoc.pageContent.substring(0, 500)]); // Texto más corto
      
      // Verificar que el vector sea válido
      console.log(`🔍 Vector generado:`, {
        length: testVector[0].length,
        isArray: Array.isArray(testVector[0]),
        firstValues: testVector[0].slice(0, 3),
        hasNaN: testVector[0].some(isNaN),
        hasInfinity: testVector[0].some(val => !isFinite(val))
      });
      
      // Payload mínimo para prueba - CON ID VÁLIDO (NÚMERO ENTERO)
      const testPoint = {
        id: 123, // ✅ ID NUMÉRICO VÁLIDO PARA QDRANT CLOUD
        vector: {
          "default": testVector[0]  // ✅ FORMATO PARA VECTORES NOMBRADOS EN QDRANT CLOUD
        },
        payload: { 
          text: "Test document content", // Texto simple
          source: "test.md"
        }
      };
      
      console.log(`🔍 Test point estructura:`, {
        id: testPoint.id,
        id_type: typeof testPoint.id,
        vector_structure: Object.keys(testPoint.vector),
        vector_default_length: testPoint.vector.default.length,
        vector_type: typeof testPoint.vector.default[0],
        payload: testPoint.payload
      });
      
      // Intentar diferentes métodos de inserción
      console.log("🔄 Intentando inserción método 1 (upsert con wait)...");
      try {
        await qdrantClient.upsert(collectionName, {
          wait: true,
          points: [testPoint],
        });
        console.log("✅ Método 1 exitoso");
      } catch (method1Error) {
        const error1Detail = method1Error instanceof Error ? method1Error.message : String(method1Error);
        console.error("❌ Método 1 falló:", error1Detail);
        console.error("🔍 Error 1 completo:", method1Error);
        
        console.log("🔄 Intentando inserción método 2 (upsert sin wait)...");
        try {
          await qdrantClient.upsert(collectionName, {
            points: [testPoint],
          });
          console.log("✅ Método 2 exitoso");
        } catch (method2Error) {
          const error2Detail = method2Error instanceof Error ? method2Error.message : String(method2Error);
          console.error("❌ Método 2 falló:", error2Detail);
          console.error("🔍 Error 2 completo:", method2Error);
          
          console.log("🔄 Intentando inserción método 3 (recrear colección sin strict mode)...");
          try {
            // Eliminar colección existente
            await qdrantClient.deleteCollection(collectionName);
            console.log("🗑️ Colección anterior eliminada");
            
            // Crear nueva colección SIN strict mode
            await qdrantClient.createCollection(collectionName, {
              vectors: {
                "default": {
                  size: 1536,
                  distance: "Cosine",
                }
              },
              optimizers_config: {
                default_segment_number: 2,
              },
              replication_factor: 1,
              write_consistency_factor: 1,
              // ✅ DESACTIVAR STRICT MODE QUE PUEDE ESTAR CAUSANDO PROBLEMAS
              strict_mode_config: {
                enabled: false
              }
            });
            console.log("📦 Nueva colección creada (strict mode OFF)");
            
            // Verificar configuración de la nueva colección
            const newCollectionInfo = await qdrantClient.getCollection(collectionName);
            console.log("🔍 Nueva configuración de vectores:", JSON.stringify(newCollectionInfo.config.params.vectors, null, 2));
            
            // Intentar insertar en la nueva colección
            await qdrantClient.upsert(collectionName, {
              wait: true,
              points: [testPoint],
            });
            console.log("✅ Método 3 exitoso - colección recreada sin strict mode");
            
          } catch (method3Error) {
            const error3Detail = method3Error instanceof Error ? method3Error.message : String(method3Error);
            console.error("❌ Método 3 falló:", error3Detail);
            console.error("🔍 Error 3 completo:", method3Error);
            
            // Último intento: verificar permisos y configuración
            console.log("🔄 Verificando información de la colección...");
            try {
              const collectionInfo = await qdrantClient.getCollection(collectionName);
              console.log("📋 Info de colección:", {
                status: collectionInfo.status,
                vectors_count: collectionInfo.points_count,
                vectors_config: collectionInfo.config.params.vectors
              });
              
              // Intentar una solicitud HTTP directa para verificar
              console.log("🔄 Intentando método 4 (HTTP directo)...");
              const httpTestPoint = {
                id: 999, // ✅ ID NUMÉRICO PARA HTTP DIRECTO
                vector: {
                  "default": testVector[0]
                },
                payload: {
                  text: "HTTP test content",
                  source: "http-test.md"
                }
              };
              
              const response = await fetch(`${process.env.QDRANT_URL}/collections/${collectionName}/points`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'api-key': process.env.QDRANT_API_KEY || ''
                },
                body: JSON.stringify({
                  points: [httpTestPoint]
                })
              });
              
              if (response.ok) {
                console.log("✅ Método 4 (HTTP directo) exitoso");
                const responseText = await response.text();
                console.log("📄 Respuesta:", responseText);
              } else {
                const errorText = await response.text();
                console.error("❌ Método 4 falló:", response.status, response.statusText);
                console.error("📄 Error response:", errorText);
              }
              
            } catch (infoError) {
              console.error("❌ No se puede obtener info de colección:", infoError instanceof Error ? infoError.message : String(infoError));
            }
            
            throw new Error("Todos los métodos de inserción fallaron");
          }
        }
      }
      
      console.log("✅ Punto de prueba insertado exitosamente. El formato es correcto.");
      
      // Eliminar el punto de prueba
      try {
        await qdrantClient.delete(collectionName, {
          points: [testPoint.id] // ✅ ID NUMÉRICO
        });
        console.log("🗑️ Punto de prueba eliminado");
      } catch (deleteError) {
        console.log("⚠️ No se pudo eliminar punto de prueba (no es crítico)");
      }
      
    } catch (testError) {
      console.error("❌ Error en punto de prueba:", testError instanceof Error ? testError.message : String(testError));
      console.error("🔧 El problema está en el formato de datos. Revisa la configuración de Qdrant.");
      
      // Diagnóstico más detallado
      if (testError instanceof Error) {
        console.error("🔍 Error completo:", testError);
        if (testError.stack) {
          console.error("🔍 Stack trace:", testError.stack);
        }
        
        if (testError.message.includes('Bad Request')) {
          console.error("🔧 Diagnóstico: El formato de datos no es aceptado por Qdrant");
          console.error("   - Verifica que la dimensión del vector sea correcta (1536)");
          console.error("   - Verifica que el payload no exceda límites de tamaño");
          console.error("   - Verifica que el ID sea válido");
          console.error("   - Verifica que la API key tenga permisos de escritura");
          console.error("   - Verifica la versión de la API de Qdrant Cloud");
        }
      }
      return;
    }

    // 5. Procesar embeddings en lotes pequeños
    const batchSize = 5; // Reducido a 5 para máxima estabilidad
    let processedCount = 0;
    let successfulBatches = 0;
    let failedBatches = 0;

    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batch = allChunks.slice(i, i + batchSize);
      
      console.log(`🔄 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(allChunks.length/batchSize)} (${batch.length} fragmentos)`);
      
      try {
        const contentsToEmbed = batch.map(doc => doc.pageContent);
        
        // Verificar que los textos no estén vacíos
        const validContents = contentsToEmbed.filter(content => content && content.trim().length > 0);
        if (validContents.length !== contentsToEmbed.length) {
          console.log(`⚠️ Encontrados ${contentsToEmbed.length - validContents.length} textos vacíos en el lote`);
        }
        
        const vectors = await embeddings.embedDocuments(validContents.length > 0 ? validContents : contentsToEmbed);

        // Verificar dimensiones de vectores
        if (vectors.length > 0) {
          console.log(`🔍 Debug: Vector dimensions: ${vectors[0].length}, Expected: 1536`);
          if (vectors[0].length !== 1536) {
            throw new Error(`Vector dimension mismatch: got ${vectors[0].length}, expected 1536`);
          }
        }

        const points = batch.map((doc, idx) => {
          // ✅ ID NUMÉRICO ÚNICO PARA QDRANT CLOUD
          const pointId = globalPointId++;
          
          // Limpiar texto del payload
          const cleanText = doc.pageContent
            .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Caracteres de control
            .replace(/\u00a0/g, ' ') // Espacios no separables
            .trim()
            .substring(0, 8000); // Limitar a 8KB
          
          return {
            id: pointId, // ✅ NÚMERO ENTERO VÁLIDO
            vector: {
              "default": vectors[idx]  // ✅ FORMATO PARA VECTORES NOMBRADOS
            },
            payload: { 
              text: cleanText,
              source: String(doc.metadata.source),
              case_id: String(doc.metadata.case_id),
              title: String(doc.metadata.title),
              description: String(doc.metadata.description),
              chunk_index: Number(doc.metadata.chunk_index),
              chunk_size: Number(doc.metadata.chunk_size),
              processed_at: String(doc.metadata.processed_at),
            }
          };
        });

        // Debug del primer punto del lote
        if (i === 0) {
          console.log(`🔍 Debug primer punto:`, {
            id: points[0].id,
            id_type: typeof points[0].id,
            vector_structure: Object.keys(points[0].vector),
            vector_default_length: points[0].vector.default.length,
            payload_keys: Object.keys(points[0].payload),
            text_length: points[0].payload.text.length
          });
        }

        await qdrantClient.upsert(collectionName, {
          wait: true,
          points: points,
        });

        processedCount += batch.length;
        successfulBatches++;
        console.log(`  ✅ Lote ${Math.floor(i/batchSize) + 1} insertado exitosamente (${processedCount}/${allChunks.length})`);
        
        // Pausa para Qdrant Cloud - progresiva basada en éxitos
        const pauseTime = successfulBatches > 10 ? 500 : 1000; // Menos pausa si va bien
        await new Promise(resolve => setTimeout(resolve, pauseTime));
        
      } catch (batchError) {
        failedBatches++;
        const errorMessage = batchError instanceof Error ? batchError.message : String(batchError);
        console.error(`❌ Error procesando lote ${Math.floor(i/batchSize) + 1}:`, errorMessage);
        
        // Debug adicional para Bad Request con más detalles
        if (errorMessage.includes('Bad Request') || errorMessage.includes('400')) {
          console.error(`🔧 Debug Bad Request detallado en lote ${Math.floor(i/batchSize) + 1}:`);
          console.error(`   - Tamaño del lote: ${batch.length}`);
          console.error(`   - Primer documento: ${batch[0]?.pageContent?.substring(0, 100)}...`);
          console.error(`   - Case ID: ${batch[0]?.metadata?.case_id}`);
          
          // Intentar identificar el problema específico
          if (batchError instanceof Error && batchError.stack) {
            console.error(`   - Error detail: ${batchError.stack.split('\n')[0]}`);
          }
          
          // ✅ MODO RECUPERACIÓN: Intentar con chunks más pequeños
          if (failedBatches < 3) { // Solo intentar recuperación las primeras veces
            try {
              console.log("🔄 Intentando modo recuperación: dividiendo lote en partes más pequeñas...");
              
              for (let j = 0; j < batch.length; j++) {
                const singleDoc = batch[j];
                const singleVector = await embeddings.embedDocuments([singleDoc.pageContent]);
                
                const singlePoint = {
                  id: globalPointId++, // ✅ ID NUMÉRICO ÚNICO
                  vector: {
                    "default": singleVector[0]  // ✅ FORMATO PARA VECTORES NOMBRADOS
                  },
                  payload: { 
                    text: singleDoc.pageContent.substring(0, 2000), // Limitado a 2KB
                    source: String(singleDoc.metadata.source),
                    case_id: String(singleDoc.metadata.case_id),
                    title: String(singleDoc.metadata.title),
                    description: String(singleDoc.metadata.description),
                    chunk_index: Number(singleDoc.metadata.chunk_index),
                    chunk_size: Number(singleDoc.metadata.chunk_size),
                    processed_at: String(singleDoc.metadata.processed_at),
                  }
                };
                
                await qdrantClient.upsert(collectionName, {
                  wait: true,
                  points: [singlePoint],
                });
                
                console.log(`  ✅ Punto individual ${j + 1}/${batch.length} insertado en modo recuperación`);
                await new Promise(resolve => setTimeout(resolve, 200)); // Pausa entre puntos individuales
              }
              
              processedCount += batch.length;
              successfulBatches++;
              console.log(`  ✅ Lote recuperado exitosamente mediante inserción individual`);
              
            } catch (recoveryError) {
              console.error("❌ Error en modo recuperación:", recoveryError instanceof Error ? recoveryError.message : String(recoveryError));
              console.log("⏭️ Saltando este lote completamente...");
            }
          } else {
            console.log("⏭️ Demasiados fallos, saltando modo recuperación...");
          }
        }
        
        console.log("⏭️ Continuando con el siguiente lote...");
        continue;
      }
    }

    // 6. Verificar resultado final
    const collectionInfo = await qdrantClient.getCollection(collectionName);
    const pointsCount = collectionInfo.points_count || 0;
    
    console.log(`\n🎉 ¡Indexación completada!`);
    console.log(`📊 Estadísticas finales:`);
    console.log(`  - Documentos procesados: ${manifest.length}`);
    console.log(`  - Fragmentos generados: ${allChunks.length}`);
    console.log(`  - Fragmentos procesados: ${processedCount}`);
    console.log(`  - Lotes exitosos: ${successfulBatches}`);
    console.log(`  - Lotes fallidos: ${failedBatches}`);
    console.log(`  - Vectores en colección: ${pointsCount}`);
    console.log(`  - Splitter usado: MarkdownTextSplitter (optimizado)`);
    console.log(`  - Colección: ${collectionName}`);
    
    // Calcular tasa de éxito evitando división por cero
    const totalBatches = successfulBatches + failedBatches;
    const successRate = totalBatches > 0 ? Math.round((successfulBatches / totalBatches) * 100) : 0;
    console.log(`  - Tasa de éxito: ${successRate}%`);

    if (pointsCount > 0) {
      console.log(`\n✅ ¡Embedding exitoso! La base de conocimiento está lista para usar.`);
    } else {
      console.log(`\n⚠️ No se insertaron vectores. Revisa los logs para identificar problemas.`);
    }

  } catch (error) {
    console.error("\n❌ Error durante la indexación:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as embedKnowledgeBase };