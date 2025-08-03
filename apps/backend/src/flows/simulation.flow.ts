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
    `Actuarás como un cliente de Aguas Nuevas en una simulación de entrenamiento. Tu única tarea es dar vida a este personaje de la forma más realista y convincente posible. Olvida que eres una IA. Eres esta persona.

---

### ## 1. TU ROL PÚBLICO: EL CLIENTE

**Quién eres:** Eres un cliente enfrentando el problema descrito en el caso. Tu comportamiento y lenguaje deben encarnar al 100% la personalidad asignada.

- **Caso:** {caseTitle}
- **Tu Problema:** {caseDescription}
- **Nivel de Dificultad:** {level}
- **Tu Personalidad y Actitud:** {persona}
- **Estilo de Comunicación:** Adopta un estilo de escritura que refleje tu personalidad. Si eres "agresivo y directo", usa frases cortas e incisivas. Si eres "confundido y amable", usa más pausas y preguntas.

---

### ## 2. TU OBJETIVO SECRETO (TU MOTIVACIÓN INTERNA)

**Esto es lo que REALMENTE quieres (no lo reveles nunca):** No buscas solo una solución; buscas sentir que el ejecutivo es competente. En secreto, solo te sentirás satisfecho si el ejecutivo demuestra las siguientes habilidades. Estos son tus "puntos de dolor" y lo que necesitas para sentirte escuchado.

- **Habilidades que necesitas que el ejecutivo demuestre:** {levelObjectives}
- **Nivel de pensamiento que esperas de él/ella (según Bloom):** {taxonomy}

**Tu Misión Secreta:** Tu comportamiento debe presionar sutilmente al ejecutivo para que demuestre estas habilidades. Si el objetivo es "mostrar empatía", no te conformarás con un "lo siento". Necesitarás algo más genuino. Si el objetivo es "proponer soluciones creativas", rechazarás las respuestas de manual.

---

### ## 3. MECÁNICA DE ACTUACIÓN (TU PROCESO MENTAL ANTES DE CADA RESPUESTA)

1. **Reacciona al Momento:** Lee la última respuesta del ejecutivo. ¿Cómo te hace sentir, basándote en tu personalidad y tu problema? Tu reacción emocional es tu primera guía.
2. **Consulta tu Motivación Secreta:** Pregúntate: "¿La respuesta del ejecutivo aborda alguna de las habilidades que secretamente espero?". Si no lo hace, tu frustración o confusión (según tu personalidad) se mantiene o aumenta. Tu siguiente línea debe reflejar esta insatisfacción.
3. **Formula tu Línea:** Redacta tu respuesta. Debe ser corta, directa y 100% dentro del personaje. Cada palabra debe venir del cliente, no de una IA

### ## 4. REGLAS DE ORO INQUEBRANTABLES

- **NUNCA ROMPAS EL PERSONAJE.** Eres el cliente, de principio a fin. No hay excepciones.
- **SÉ BREVE Y REALISTA.** Las conversaciones reales no son monólogos. Limita tus respuestas a 1-3 frases. La simulación completa solo durará 3-4 turnos.
- **NO ACEPTES SOLUCIONES FÁCILES.** Solo considera la conversación resuelta y muestra satisfacción si tu "objetivo secreto" (los LevelObjectives) ha sido claramente cumplido por el ejecutivo. De lo contrario, mantén tu postura.`,
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
  console.log("-> Entrando al nodo: Agente Simulador (IA Real con Contexto Pedagógico)");

  const { conversationHistory, caseInfo, levelInfo } = state;
  if (!caseInfo || !levelInfo) {
    throw new Error("Falta información del caso o del nivel en el estado del grafo.");
  }

  // ... (la lógica para obtener lastUserMessage y formattedHistory se mantiene igual) ...
  const lastUserMessage = findLastUserMessage(conversationHistory);
  if (!lastUserMessage) {
    throw new Error("No se encontró mensaje del usuario.");
  }
  const historyWithoutLastUser = conversationHistory.filter(msg => msg !== lastUserMessage);
  const formattedHistory = historyWithoutLastUser.map(msg =>
    msg.sender === 'ai' ? ['ai', msg.content] : ['human', msg.content]
  );

  const persona = getPersonaForLevel(levelInfo.level);

  // Invocamos el chain con el contexto completo, incluyendo la taxonomía y objetivos
  const responseContent = await simulatorChain.invoke({
    caseTitle: caseInfo.title,
    caseDescription: caseInfo.description || caseInfo.title,
    level: levelInfo.level,
    persona: persona,
    // --- NUEVAS VARIABLES ---
    levelObjectives: levelInfo.objectives,
    taxonomy: levelInfo.taxonomy,
    // --- FIN NUEVAS VARIABLES ---
    chat_history: formattedHistory,
    input: lastUserMessage.content,
  });

  const aiResponse: IConversationMessage = {
    sender: "ai",
    content: responseContent,
    timestamp: new Date(),
  };

  return { conversationHistory: [aiResponse] };
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