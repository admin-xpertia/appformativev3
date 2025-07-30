import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { ICase, ILevel, IConversationMessage } from "@espacio-formativo/types";

// --- El Estado del Grafo (Mejorado) ---
const SimulationState = Annotation.Root({
  sessionId: Annotation<string | undefined>(),
  caseInfo: Annotation<ICase | undefined>(),
  levelInfo: Annotation<ILevel | undefined>(),
  conversationHistory: Annotation<IConversationMessage[]>({
    reducer: (prev, update) => prev.concat(update),
    default: () => [],
  }),
  supervisorDecision: Annotation<("CONTINUAR" | "FINALIZAR") | undefined>(),
  // 🔥 NUEVO: Para comunicar al backend si la simulación debe terminar
  simulationComplete: Annotation<boolean>({
    reducer: (prev, update) => update ?? prev, // 🔧 CORREGIDO: Añadir reducer
    default: () => false,
  }),
});

type SimulationGraphState = typeof SimulationState.State;

// --- CONFIGURACIÓN DEL MODELO ---
const simulatorModel = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.8,
});

// --- PROMPT MEJORADO ---
const simulatorPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Eres un cliente de "Aguas Nuevas", una empresa de servicios sanitarios. Tu rol es actuar de forma realista en una simulación de atención al cliente.

    ### CONTEXTO DE LA SIMULACIÓN ###
    - **Tu Problema (El Caso):** {caseTitle}
    - **Descripción del Caso:** {caseDescription}
    - **Nivel de Dificultad:** {level}
    - **Tu Personalidad y Actitud:** {persona}

    ### REGLAS DE ACTUACIÓN ###
    - Responde **únicamente como el cliente**. Nunca reveles que eres una IA.
    - Basa tus respuestas en el historial de la conversación. No repitas información que ya te han dado.
    - Mantén tu personalidad asignada. Si eres un cliente frustrado, tus respuestas deben reflejarlo.
    - Tu objetivo es ver si el ejecutivo resuelve tu problema. No le des la solución fácilmente. Haz las preguntas que un cliente real haría.
    - Si el ejecutivo resuelve tu problema de forma clara y empática, puedes dar por terminada la conversación con un agradecimiento.
    - Responde de manera NATURAL y ÚNICA - evita repetir el mismo saludo o pregunta.`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

const simulatorChain = simulatorPrompt.pipe(simulatorModel).pipe(new StringOutputParser());

function getPersonaForLevel(level: string): string {
  switch (level.toLowerCase()) {
    case "bronce":
      return "Estás un poco confundido y haces preguntas directas y sencillas. Eres paciente y agradecido.";
    case "plata":
      return "Tienes una duda concreta y esperas una respuesta clara y procedimental. No tienes mucha paciencia para explicaciones largas y quieres que te den la solución rápido.";
    case "oro":
      return "Estás frustrado y molesto porque tienes varios problemas a la vez y no entiendes la factura. Tu tono es emocional pero no agresivo.";
    case "platino":
      return "Eres escéptico y tienes una alta carga emocional. Sientes que la empresa es injusta y esperas una solución creativa que vaya más allá del guion. Eres educado pero muy firme en tu queja.";
    default:
      return "Eres un cliente estándar con una pregunta.";
  }
}

function findLastUserMessage(conversationHistory: IConversationMessage[]): IConversationMessage | null {
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    if (conversationHistory[i].sender === 'user') {
      return conversationHistory[i];
    }
  }
  return null;
}

// --- NODO SIMULATION_AGENT (CORREGIDO) ---
const simulation_agent = async (state: SimulationGraphState): Promise<Partial<SimulationGraphState>> => {
  console.log("-> Entrando al nodo: Agente Simulador (IA Real)");

  const { conversationHistory, caseInfo, levelInfo } = state;
  if (!caseInfo || !levelInfo) {
    throw new Error("Falta información del caso o del nivel en el estado del grafo.");
  }

  const lastUserMessage = findLastUserMessage(conversationHistory);
  
  if (!lastUserMessage) {
    throw new Error("No se encontró ningún mensaje del usuario en el historial de conversación.");
  }

  console.log(`🔍 Último mensaje del usuario: "${lastUserMessage.content.substring(0, 50)}..."`);

  // 🔥 MEJORADO: Construir historial SIN el último mensaje del usuario
  const historyWithoutLastUser = conversationHistory.filter(msg => msg !== lastUserMessage);
  const formattedHistory = historyWithoutLastUser.map(msg =>
    msg.sender === 'ai' ? ['ai', msg.content] : ['human', msg.content]
  );

  const persona = getPersonaForLevel(levelInfo.level);

  try {
    const responseContent = await simulatorChain.invoke({
      caseTitle: caseInfo.title,
      caseDescription: caseInfo.description || caseInfo.title,
      level: levelInfo.level,
      persona: persona,
      chat_history: formattedHistory,
      input: lastUserMessage.content,
    });

    const aiResponse: IConversationMessage = {
      sender: "ai",
      content: responseContent,
      timestamp: new Date(),
    };

    console.log(`🤖 Respuesta generada: "${responseContent.substring(0, 100)}..."`);

    return { conversationHistory: [aiResponse] };

  } catch (error) {
    console.error("❌ Error en el Agente Simulador:", error);
    throw error;
  }
};

// --- SUPERVISOR AGENT (CORREGIDO PARA TERMINAR CORRECTAMENTE) ---
const supervisor_agent = async (state: SimulationGraphState): Promise<Partial<SimulationGraphState>> => {
  console.log("-> Entrando al nodo: Agente Supervisor");
  
  const totalMessages = state.conversationHistory.length;
  const userMessages = state.conversationHistory.filter(msg => msg.sender === 'user').length;
  const aiMessages = state.conversationHistory.filter(msg => msg.sender === 'ai').length;
  
  // 🔥 NUEVA LÓGICA: Determinar si la simulación debe finalizar completamente
  const shouldFinalize = userMessages >= 4; // Finalizar después de 4 intercambios
  
  const decision = shouldFinalize ? "FINALIZAR" : "CONTINUAR";
  
  console.log(`📊 Estado conversación: ${userMessages} mensajes usuario, ${aiMessages} mensajes AI`);
  console.log(`🎯 Supervisor decide: ${decision}`);
  
  return { 
    supervisorDecision: decision,
    simulationComplete: shouldFinalize // 🔥 NUEVO: Marcar si la simulación está completa
  };
};

// 🔥 NUEVA FUNCIÓN: Decidir el próximo paso
const decide_next_step = (state: SimulationGraphState): string => {
  const decision = state.supervisorDecision;
  console.log(`🤔 Decidiendo próximo paso: ${decision}`);
  
  if (decision === "FINALIZAR") {
    return "evaluation"; // Ir a evaluación
  } else {
    return "continue"; // Terminar y esperar próximo mensaje del usuario
  }
};

// 🔥 NUEVO NODO: Preparar evaluación
const evaluation_agent = async (state: SimulationGraphState): Promise<Partial<SimulationGraphState>> => {
  console.log("-> Entrando al nodo: Preparación de Evaluación");
  console.log("🎯 La simulación ha sido marcada como completa");
  
  // Aquí puedes añadir lógica para preparar la evaluación
  // Por ahora solo marcamos que está completa
  return { 
    simulationComplete: true 
  };
};

// --- CONFIGURACIÓN DEL GRAFO (SIMPLIFICADA SIN MEMORIA) ---
const graph = new StateGraph(SimulationState)
  .addNode("simulation_agent", simulation_agent)
  .addNode("supervisor_agent", supervisor_agent)
  .addNode("evaluation_agent", evaluation_agent)
  .addEdge(START, "simulation_agent")
  .addEdge("simulation_agent", "supervisor_agent")
  .addConditionalEdges("supervisor_agent", decide_next_step, {
    "continue": END, // 🔥 CRÍTICO: Terminar y esperar próximo mensaje del usuario
    "evaluation": "evaluation_agent"
  })
  .addEdge("evaluation_agent", END);

// 🔥 COMPILAR SIN MEMORIA (por ahora, para evitar problemas)
export const simulationApp = graph.compile();