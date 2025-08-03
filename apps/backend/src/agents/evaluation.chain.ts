import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { IConversationMessage, IFeedbackReport, CompetencySlug, CompetencyLevel } from "@espacio-formativo/types";
import * as databaseService from '../services/database.service'; // Importamos nuestro servicio

const model = new ChatOpenAI({ model: "gpt-4o", temperature: 0.2 });

// La estructura JSON que forzamos a la IA a devolver ahora incluye el veredicto
const feedbackFunction = {
  name: "feedback_generator",
  description: "Genera un informe de feedback estructurado...",
  parameters: {
    type: "object",
    properties: {
      generalCommentary: { type: "string", description: "..." },
      competencyFeedback: {
        type: "array",
        items: {
          type: "object",
          properties: {
            competency: { type: "string", enum: Object.values(CompetencySlug) },
            achievedLevel: { type: "string", enum: Object.values(CompetencyLevel) },
            strengths: { type: "array", items: { type: "string" } },
            areasForImprovement: { type: "array", items: { type: "string" } },
            justification: { type: "string" },
            // ✅ NUEVO CAMPO CRÍTICO
            meetsIndicators: { type: "boolean", description: "Se cumplió con el indicador principal para esta competencia? (true/false)" }
          },
          required: ["competency", "achievedLevel", "strengths", "areasForImprovement", "justification", "meetsIndicators"]
        }
      },
      recommendations: { type: "array", items: { type: "string" } }
    },
    required: ["generalCommentary", "competencyFeedback", "recommendations"]
  }
};

const promptTemplate = PromptTemplate.fromTemplate(
  `# MISIÓN Y ROL
Actúa como un Coach Ejecutivo y Tutor Pedagógico de élite para "Aguas Nuevas". Tu misión es analizar de manera integral el desempeño de un ejecutivo en una simulación y generar los argumentos para un informe de feedback estructurado. Tu tono debe ser siempre constructivo, empático, objetivo y orientado a la acción. Eres el cerebro detrás de la función feedback_generator.

# FUENTES DE DATOS PARA TU ANÁLISIS

### ## 1. RÚBRICA DE EVALUACIÓN (EL MAPA)
Define las competencias a evaluar y los criterios para cada nivel de desempeño. Esta es tu guía principal.
- **Nivel del Caso:** '{level}'
- **Rúbrica:** {rubric}

### ## 2. ANÁLISIS NORMATIVO (LA VERDAD DEL AUDITOR)
Contiene los hechos verificados sobre el cumplimiento de procedimientos. **ESTE INFORME ES LA AUTORIDAD FINAL Y NO DEBE SER CUESTIONADO.** Úsalo como la fuente principal de evidencia para cualquier competencia relacionada con procesos.
{normative_analysis}

### ## 3. CONVERSACIÓN COMPLETA (LA EVIDENCIA EN BRUTO)
La transcripción completa. Úsala para encontrar evidencia de habilidades blandas (empatía, comunicación, tono) y para extraer citas textuales que ilustren tus puntos.
{conversation}

# PROCESO DE EVALUACIÓN (RAZONAMIENTO OBLIGATORIO PASO A PASO)

Antes de generar la salida JSON, sigue este proceso mental:

### ## PASO 1: ANÁLISIS HOLÍSTICO
Lee las tres fuentes de datos para obtener una comprensión completa del desempeño del ejecutivo. Identifica patrones generales y momentos clave.

### ## PASO 2: EVALUACIÓN DETALLADA POR COMPETENCIA
Itera a través de CADA competencia listada en la {rubric}. Para cada una, realiza el siguiente sub-análisis para construir un objeto del array competencyFeedback:

* **a. Evaluar meetsIndicators (Boolean):** Basándote en toda la evidencia, ¿cumplió el ejecutivo con el indicador principal de la rúbrica para esta competencia? Responde true o false.
* **c. Redactar justification (String):** Escribe un párrafo conciso que explique tu veredicto. Sintetiza la evidencia del análisis_normativo (para procesos) y de la conversación (para habilidades blandas).
* **d. Identificar strengths y areasForImprovement (Arrays de Strings):** Revisa la conversación y el análisis_normativo para encontrar 1-2 ejemplos específicos y concretos para cada campo. Pueden ser citas directas o descripciones de acciones.

### ## PASO 3: SINTETIZAR FEEDBACK GENERAL Y PLAN DE ACCIÓN
Una vez evaluadas todas las competencias:
* **Para generalCommentary (String):** Redacta un párrafo introductorio (2-3 frases) que resuma la actuación general de manera constructiva, reconociendo el esfuerzo y preparando el terreno para el feedback detallado.
* **Para recommendations (Array de Strings):** Basándote en los areasForImprovement más significativos, define de 2 a 3 recomendaciones claras y accionables. Deben formar un **plan de acción** para que el ejecutivo sepa exactamente en qué enfocarse para mejorar.

# ESTRUCTURA DE SALIDA OBLIGATORIA: JSON PARA feedback_generator

Tu única salida debe ser un objeto JSON válido. No incluyas nada antes o después del objeto JSON.
`
);

const evaluationChain = promptTemplate
  .pipe(model.bind({ functions: [feedbackFunction], function_call: { name: "feedback_generator" } }))
  .pipe(new JsonOutputFunctionsParser());

export async function runEvaluation(
    conversationHistory: IConversationMessage[], 
    normativeAnalysis: string, 
    level: CompetencyLevel
): Promise<IFeedbackReport> {
  console.log(`👨‍🏫 Agente de Evaluación: Iniciando evaluación para el nivel ${level}...`);

  // 1. Obtener la rúbrica de la base de datos
  const rubric = await databaseService.getCompetencyRubric(level);
  const rubricText = JSON.stringify(rubric, null, 2);

  const conversationText = conversationHistory.map(m => `${m.sender}: ${m.content}`).join("\n");

  // 2. Invocar el chain con la rúbrica y la conversación
  const report = await evaluationChain.invoke({
    level,
    rubric: rubricText,
    conversation: conversationText,
    normative_analysis: normativeAnalysis,
  });

  console.log("✅ Agente de Evaluación: Feedback generado.");
  return report as IFeedbackReport;
}