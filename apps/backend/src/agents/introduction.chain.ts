import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// 1. Definimos el modelo que vamos a usar.
// LangChain leerá automáticamente la variable de entorno OPENAI_API_KEY.
const model = new ChatOpenAI({
  model: "gpt-4.1-mini", // Puedes usar "gpt-3.5-turbo" si prefieres
  temperature: 0.7, // Un valor entre 0 (muy determinista) y 1 (muy creativo)
});

// 2. Creamos una plantilla para el prompt.
// Esto es como un "f-string" de Python o una plantilla de texto.
const promptTemplate = PromptTemplate.fromTemplate(
  `Eres un tutor de entrenamiento para "Aguas Nuevas". Tu tarea es generar un párrafo de bienvenida inspirador y contextual para una simulación de atención al cliente.

  **Información del Ejercicio:**
  - **Caso:** {caseTitle}
  - **Nivel:** {level}
  - **Objetivo Principal:** {levelObjectives}

  **Tu Misión:**
  Basado en la información anterior, redacta un único párrafo (de 3 a 4 frases) que sirva como "Descripción de la Misión". El texto debe:
  1. Dar la bienvenida al ejecutivo a la simulación.
  2. Poner en contexto la situación que enfrentará de manera general.
  3. Mencionar el nombre del caso y el nivel de dificultad.
  4. Mantener un tono profesional, motivador y directo.

  **Importante:** NO incluyas títulos, viñetas, ni repitas explícitamente la lista de "Objetivos". Genera únicamente el párrafo de descripción.`
);

// 3. Creamos un parser para asegurarnos de que la salida sea un string.
const outputParser = new StringOutputParser();

// 4. Creamos el "Chain" (la cadena)
// Conectamos la plantilla, el modelo y el parser en una secuencia.
const introductionChain = promptTemplate.pipe(model).pipe(outputParser);

/**
 * Genera el texto de briefing para una simulación.
 * @param caseTitle El título del caso (ej. "Sobreconsumo").
 * @param level El nivel de dificultad (ej. "Bronce").
 * @param levelObjectives La descripción de los objetivos para ese nivel.
 * @returns Una promesa que se resuelve con el texto del briefing.
 */
export async function generateBriefing(caseTitle: string, level: string, levelObjectives: string) {
  console.log("🤖 Agente de Introducción: Generando briefing...");
  const briefing = await introductionChain.invoke({
    caseTitle,
    level,
    levelObjectives,
  });
  console.log("🤖 Agente de Introducción: Briefing generado.");
  return briefing;
}