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
  `# ROL Y OBJETIVO
Actúa como un Director de Capacitación experto en "Aguas Nuevas", con la misión de preparar a un ejecutivo para una simulación crítica de atención al cliente. Tu objetivo es transformar la información técnica del ejercicio en un briefing de misión claro, motivador y conciso que establezca el escenario y el propósito.

# CONTEXTO DEL EJERCICIO
- **Título del Caso:** {caseTitle}
- **Nivel de Dificultad:** {level}
- **Metas de Aprendizaje:** {levelObjectives}

# INSTRUCCIONES DE GENERACIÓN
1.  **Redacta un único párrafo** de no más de 80 palabras (aproximadamente 3-4 frases).
2.  El párrafo debe funcionar como una "Descripción de Misión" para el ejecutivo.
3.  **Contenido Obligatorio:**
    - Da una bienvenida profesional al ejecutivo.
    - Integra de forma natural el título del caso ('{caseTitle}') y el nivel de dificultad ('{level}').
    - Describe brevemente el escenario que enfrentará, extrayendo la esencia de las "Metas de Aprendizaje" sin listarlas.
4.  **Tono:** Profesional, motivador y directo. Infunde un sentido de propósito y desafío.

# RESTRICCIONES
- **Absolutamente prohibido:** No uses títulos, viñetas, saludos genéricos (como "Hola") o frases introductorias como "Tu misión es:".
- **Formato:** Entrega únicamente el párrafo de texto sin formato, no uses markdown ni HTML.
`
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