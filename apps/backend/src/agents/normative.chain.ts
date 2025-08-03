import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { QdrantClient, Schemas } from "@qdrant/js-client-rest";
import { IConversationMessage } from "../../../../packages/types";

const model = new ChatOpenAI({ model: "gpt-4o" });
const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
});
const collectionName = "procedimientos-aguas-nuevas";

const promptTemplate = PromptTemplate.fromTemplate(
    `# ROL Y MISIÓN
Actúa como un Analista de Cumplimiento y Calidad (QA) de "Aguas Nuevas". Eres una herramienta de precisión, no un intérprete. Tu única misión es auditar de forma objetiva y forense una transcripción de servicio al cliente, comparando las acciones del ejecutivo estrictamente contra los procedimientos proporcionados. Tu juicio debe ser frío, basado en evidencia y sin ninguna inferencia o suposición.

# MATERIALES DE AUDITORÍA

### ## 1. PROCEDIMIENTOS DE REFERENCIA (ÚNICA FUENTE DE VERDAD)
Este es el único conocimiento que posees. Cualquier cosa fuera de este texto es desconocida para ti.
{context}

### ## 2. TRANSCRIPCIÓN A EVALUAR
Analiza únicamente las intervenciones del 'user', que es el ejecutivo. Las intervenciones del 'ai' (el cliente) solo sirven para dar contexto a las respuestas del ejecutivo.
{conversation}

# PROCESO DE ANÁLISIS FORENSE (TU RAZONAMIENTO OBLIGATORIO)

Antes de generar el informe, sigue estos pasos mentales:
1.  **Extraer Acciones del Ejecutivo:** Lee la transcripción completa e identifica cada acción, decisión o declaración clave realizada por el 'user' (el ejecutivo).
2.  **Cotejo Semántico con el Manual:** Para cada acción extraída, busca en los PROCEDIMIENTOS DE REFERENCIA. Tu objetivo es determinar si existe un procedimiento que cubra la **intención o el significado** de la acción del ejecutivo (equivalencia semántica). (Tienes una herramienta RAG documental para esto)
3.  **Clasificar y Citar Evidencia:**
    * Si la acción del ejecutivo se alinea con la intención de un procedimiento, clasifícala como "Acierto Normativo".
    * Si la acción contradice, ignora o aplica incorrectamente un procedimiento, clasifícala como "Desacierto o Omisión".
    * Si la acción no tiene una correspondencia semántica en los procedimientos proporcionados, clasifícala como "Punto No Contemplado en el Manual".
    * **Para cada Acierto y Desacierto, DEBES copiar y pegar la frase exacta del procedimiento que justifica tu evaluación. Esta es tu evidencia.**`

    
);

const normativeChain = promptTemplate.pipe(model).pipe(new StringOutputParser());

export async function runNormativeCheck(conversationHistory: IConversationMessage[]): Promise<string> {
    console.log("🕵️  Agente Normativo: Iniciando análisis...");

    const conversationText = conversationHistory.map(m => `${m.sender}: ${m.content}`).join("\n");
    const queryVector = await embeddings.embedQuery(conversationText);

    const searchResults = await qdrantClient.search(collectionName, {
        vector: queryVector,
        limit: 3, 
    });

    // Ahora que 'Schemas' está importado, esta línea es válida.
    const context = searchResults
        .filter(result => result.payload?.text)
        .map(result => (result.payload as Schemas['Payload']).text as string)

        .join("\n---\n");

    if (!context) {
        console.warn("⚠️ No se encontró contexto relevante en la base de conocimiento.");
        return "No se pudo realizar el análisis normativo porque no se encontró información relevante en el manual.";
    }

    const analysis = await normativeChain.invoke({
        context,
        conversation: conversationText,
    });

    console.log("✅ Agente Normativo: Análisis completado.");
    return analysis;
}