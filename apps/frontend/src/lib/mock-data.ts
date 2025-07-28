// Usuario de ejemplo
export const mockUser = {
  id: "user123",
  name: "María González",
  avatar: "/placeholder.svg?height=32&width=32&text=MG",
}

// Progreso en competencias (mock)
export const mockCompetencyProgress = [
  { competency: "enfoque-cliente", progress: 75, level: "plata" },
  { competency: "regulaciones", progress: 45, level: "bronce" },
  { competency: "resolucion-problemas", progress: 90, level: "oro" },
  { competency: "comunicacion-efectiva", progress: 60, level: "plata" },
  { competency: "integridad", progress: 85, level: "oro" },
]

// Casos disponibles (mock)
export const mockCases = [
  {
    id: "sobreconsumo",
    title: "Sobreconsumo",
    currentLevel: "plata",
    attempts: "2 de 3",
    progress: 67,
    available: true,
    lastAttempt: "15 Nov 2024",
  },
  {
    id: "la-boleta",
    title: "La Boleta",
    currentLevel: "bronce",
    attempts: "1 de 3",
    progress: 33,
    available: true,
    lastAttempt: "12 Nov 2024",
  },
  {
    id: "termino-medio",
    title: "Término Medio",
    currentLevel: "oro",
    attempts: "3 de 3",
    progress: 100,
    available: true,
    lastAttempt: "18 Nov 2024",
  },
  {
    id: "prorrateo",
    title: "Prorrateo",
    currentLevel: "bronce",
    attempts: "0 de 3",
    progress: 0,
    available: true,
  },
  {
    id: "corte-y-reposicion",
    title: "Corte y Reposición",
    currentLevel: "platino",
    attempts: "2 de 3",
    progress: 85,
    available: true,
    lastAttempt: "20 Nov 2024",
  },
]

// Conversación simulada (mock)
export const mockConversation = [
  {
    sender: "ai" as const,
    content:
      "Hola, buenos días. Soy Juan Pérez y tengo un problema con mi factura de este mes. Me llegó mucho más alta de lo normal y no entiendo por qué.",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    sender: "user" as const,
    content:
      "Buenos días Sr. Pérez, entiendo su preocupación. Mi nombre es María y estaré ayudándole con su consulta. ¿Podría proporcionarme su número de cliente para revisar su cuenta?",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    sender: "ai" as const,
    content:
      "Sí, claro. Mi número de cliente es 12345678. La factura me llegó por $85.000 cuando normalmente pago alrededor de $45.000. Es casi el doble y no he cambiado mis hábitos de consumo.",
    timestamp: new Date(Date.now() - 180000),
  },
]

// Feedback simulado (mock)
export const mockFeedback = {
  generalCommentary:
    "Excelente manejo de la situación. Demostró profesionalismo y empatía durante toda la conversación. El cliente se sintió escuchado y comprendido. La resolución fue efectiva y se siguieron los procedimientos correctos. Se destaca la capacidad de mantener la calma y brindar soluciones concretas.",
  competencyFeedback: [
    {
      competency: "enfoque-cliente",
      achievedLevel: "oro",
      strengths: [
        "Demostró empatía genuina desde el primer contacto",
        "Utilizó escucha activa para comprender la preocupación del cliente",
        "Mantuvo un tono profesional y amable durante toda la conversación",
        "Se presentó adecuadamente y generó confianza",
      ],
      areasForImprovement: [
        "Podría ser más proactivo en ofrecer alternativas adicionales",
        "Considerar hacer un seguimiento posterior para asegurar satisfacción",
      ],
      justification:
        "El usuario mostró excelentes habilidades de servicio al cliente, estableciendo rapport desde el inicio y manteniendo una actitud empática. La presentación personal fue apropiada y generó confianza en el cliente.",
    },
    {
      competency: "resolucion-problemas",
      achievedLevel: "plata",
      strengths: [
        "Identificó correctamente la causa del problema",
        "Aplicó el procedimiento estándar de manera efectiva",
        "Ofreció una solución clara y comprensible",
      ],
      areasForImprovement: [
        "Podría explorar más opciones antes de decidir la solución final",
        "Considerar explicar el proceso de resolución paso a paso",
      ],
      justification:
        "Demostró capacidad sólida para resolver el problema, aunque podría beneficiarse de un enfoque más analítico para explorar múltiples soluciones.",
    },
    {
      competency: "comunicacion-efectiva",
      achievedLevel: "oro",
      strengths: [
        "Utilizó lenguaje claro y comprensible",
        "Hizo preguntas pertinentes para obtener información",
        "Explicó los procedimientos de manera didáctica",
        "Confirmó la comprensión del cliente",
      ],
      areasForImprovement: ["Podría utilizar más técnicas de parafraseo para confirmar entendimiento"],
      justification:
        "Excelente comunicación bidireccional. El usuario demostró claridad en sus explicaciones y se aseguró de que el cliente comprendiera cada paso del proceso.",
    },
  ],
  recommendations: [
    "Revisar la sección 3.2 del manual de atención al cliente sobre técnicas de seguimiento post-resolución",
    "Practicar técnicas avanzadas de resolución de conflictos en el módulo de capacitación online",
    "Completar el curso 'Comunicación Empática en Servicios' disponible en la plataforma de aprendizaje",
    "Participar en el taller grupal 'Análisis de Casos Complejos' programado para la próxima semana",
  ],
}
