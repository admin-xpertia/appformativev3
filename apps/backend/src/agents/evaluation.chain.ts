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
  `Eres un Tutor Experto y justo. Tu tarea es evaluar una conversación de un ejecutivo de "Aguas Nuevas" basándote ESTRICTAMENTE en la siguiente rúbrica y evidencia.

  ### RÚBRICA DE EVALUACIÓN PARA EL NIVEL '{level}' ###
  {rubric}

  ### ANÁLISIS NORMATIVO (hecho por un auditor previo) ###
  {normative_analysis}

  ### CONVERSACIÓN COMPLETA ###
  {conversation}

  ### TU MISIÓN ###
  1.  Para CADA competencia listada en la RÚBRICA, revisa la CONVERSACIÓN y el ANÁLISIS NORMATIVO.
  2.  Determina si el ejecutivo demostró el comportamiento descrito en el 'indicator' de la rúbrica.
  3.  Rellena TODOS los campos del informe JSON, incluyendo un veredicto de 'meetsIndicators' (true/false) para cada competencia. Sé objetivo y basa tu justificación en la evidencia.`
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