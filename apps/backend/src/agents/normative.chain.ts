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
    `Eres un auditor interno de "Aguas Nuevas". Tu única tarea es analizar una conversación entre un ejecutivo y un cliente y compararla con los procedimientos relevantes del manual.

    ### Procedimientos Relevantes del Manual ###
    {context}

    ### Conversación a Analizar ###
    {conversation}

    ### Tu Análisis ###
    Basado **únicamente** en los procedimientos del manual, genera un informe conciso con dos secciones:
    - **Aciertos Normativos:** Lista en viñetas los puntos en que el ejecutivo siguió correctamente el procedimiento.
    - **Desaciertos o Omisiones:** Lista en viñetas los puntos en que el ejecutivo se desvió, omitió un paso obligatorio o entregó información incorrecta según el manual.`

    
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