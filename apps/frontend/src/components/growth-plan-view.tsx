"use client"

import { useState } from "react"
import { CheckCircle, Circle, BarChart3, BookOpen, X, Calendar, MessageSquare, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface GrowthTask {
  id: string
  title: string
  description: string
  completed: boolean
  resourceType: "manual" | "video" | "exercise"
  resourceContent?: string
}

interface SimulationHistory {
  id: string
  date: string
  caseTitle: string
  caseId: string
  level: string
  passed: boolean
  feedback: {
    generalCommentary: string
    competencyFeedback: Array<{
      competency: string
      achievedLevel: string
      strengths: string[]
      areasForImprovement: string[]
      justification: string
    }>
  }
}

const mockGrowthTasks: GrowthTask[] = [
  {
    id: "1",
    title: "Explorar el concepto de escucha activa en el Manual (Cap. 2)",
    description: "Revisar las técnicas fundamentales de escucha activa para mejorar la comunicación con clientes",
    completed: false,
    resourceType: "manual",
    resourceContent: `# Capítulo 2: Escucha Activa

## ¿Qué es la Escucha Activa?

La escucha activa es una habilidad fundamental en el servicio al cliente que va más allá de simplemente oír las palabras del cliente. Implica:

- **Atención completa**: Concentrarse totalmente en lo que dice el cliente
- **Comprensión empática**: Entender no solo las palabras, sino las emociones detrás
- **Respuesta apropiada**: Demostrar que has entendido mediante respuestas reflexivas

## Técnicas Clave

### 1. Parafraseo
Repetir con tus propias palabras lo que el cliente ha dicho:
- "Si entiendo correctamente, usted está preocupado porque..."
- "Lo que escucho es que..."

### 2. Preguntas Clarificadoras
- "¿Podría contarme más sobre...?"
- "¿Qué significa exactamente cuando dice...?"

### 3. Validación Emocional
- "Entiendo que esto debe ser frustrante"
- "Comprendo su preocupación"

## Ejercicios Prácticos

1. **Ejercicio de Parafraseo**: Practica reformular quejas comunes
2. **Simulación de Escucha**: Graba conversaciones y analiza tu nivel de escucha
3. **Identificación de Emociones**: Aprende a reconocer señales emocionales en el lenguaje

## Beneficios de la Escucha Activa

- Mejora la satisfacción del cliente
- Reduce malentendidos
- Construye confianza y rapport
- Facilita la resolución de problemas`,
  },
  {
    id: "2",
    title: "Practicar técnicas de resolución de conflictos",
    description: "Completar ejercicios interactivos sobre manejo de situaciones difíciles",
    completed: true,
    resourceType: "exercise",
  },
  {
    id: "3",
    title: "Ver video: Comunicación Empática en Servicios",
    description: "Módulo de 15 minutos sobre técnicas avanzadas de empatía",
    completed: false,
    resourceType: "video",
  },
  {
    id: "4",
    title: "Revisar casos de estudio de resolución exitosa",
    description: "Analizar 3 casos reales de resolución de problemas complejos",
    completed: false,
    resourceType: "manual",
  },
]

const mockSimulationHistory: SimulationHistory[] = [
  {
    id: "sim-1",
    date: "2024-11-20",
    caseTitle: "Sobreconsumo",
    caseId: "sobreconsumo",
    level: "oro",
    passed: true,
    feedback: {
      generalCommentary:
        "Excelente manejo de la situación. Demostró profesionalismo y empatía durante toda la conversación. El cliente se sintió escuchado y comprendido. La resolución fue efectiva y se siguieron los procedimientos correctos.",
      competencyFeedback: [
        {
          competency: "enfoque-cliente",
          achievedLevel: "oro",
          strengths: [
            "Demostró empatía genuina desde el primer contacto",
            "Utilizó escucha activa para comprender la preocupación del cliente",
            "Mantuvo un tono profesional y amable durante toda la conversación",
          ],
          areasForImprovement: ["Podría ser más proactivo en ofrecer alternativas adicionales"],
          justification:
            "El usuario mostró excelentes habilidades de servicio al cliente, estableciendo rapport desde el inicio.",
        },
        {
          competency: "resolucion-problemas",
          achievedLevel: "plata",
          strengths: [
            "Identificó correctamente la causa del problema",
            "Aplicó el procedimiento estándar de manera efectiva",
          ],
          areasForImprovement: ["Podría explorar más opciones antes de decidir la solución final"],
          justification:
            "Demostró capacidad sólida para resolver el problema, aunque podría beneficiarse de un enfoque más analítico.",
        },
      ],
    },
  },
  {
    id: "sim-2",
    date: "2024-11-18",
    caseTitle: "La Boleta",
    caseId: "la-boleta",
    level: "plata",
    passed: true,
    feedback: {
      generalCommentary:
        "Buen desempeño general. Logró explicar los conceptos de la factura de manera clara y comprensible. El cliente quedó satisfecho con la información proporcionada.",
      competencyFeedback: [
        {
          competency: "comunicacion-efectiva",
          achievedLevel: "plata",
          strengths: [
            "Explicó los conceptos técnicos de manera sencilla",
            "Verificó la comprensión del cliente regularmente",
          ],
          areasForImprovement: ["Podría utilizar más ejemplos prácticos", "Mejorar la estructura de las explicaciones"],
          justification: "Comunicación clara pero con oportunidades de mejora en la didáctica.",
        },
      ],
    },
  },
  {
    id: "sim-3",
    date: "2024-11-15",
    caseTitle: "Término Medio",
    caseId: "termino-medio",
    level: "bronce",
    passed: false,
    feedback: {
      generalCommentary:
        "Se identificaron áreas importantes de mejora. Aunque se resolvió la situación, el proceso no fue óptimo y se perdieron oportunidades de brindar un mejor servicio.",
      competencyFeedback: [
        {
          competency: "enfoque-cliente",
          achievedLevel: "bronce",
          strengths: ["Mantuvo la cortesía durante la conversación"],
          areasForImprovement: [
            "Necesita desarrollar más empatía",
            "Debe mejorar la escucha activa",
            "Falta personalización en el trato",
          ],
          justification: "El enfoque fue muy transaccional, faltó conexión emocional con el cliente.",
        },
      ],
    },
  },
]

const competencyNames = {
  "enfoque-cliente": "Enfoque en el Cliente y Empatía",
  regulaciones: "Conocimiento y Aplicación de Regulaciones",
  "resolucion-problemas": "Resolución de Problemas",
  "comunicacion-efectiva": "Comunicación Efectiva",
  integridad: "Integridad",
}

const levelColors = {
  bronce: "bg-gradient-to-r from-amber-600 to-amber-500 text-white",
  plata: "bg-gradient-to-r from-gray-400 to-gray-300 text-white",
  oro: "bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900",
  platino: "bg-gradient-to-r from-gray-300 to-gray-200 text-gray-900",
}

export function GrowthPlanView() {
  const [tasks, setTasks] = useState<GrowthTask[]>(mockGrowthTasks)
  const [selectedResource, setSelectedResource] = useState<GrowthTask | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const newCompleted = !task.completed
          if (newCompleted && !task.completed) {
            setShowCelebration(true)
            setTimeout(() => setShowCelebration(false), 2000)
          }
          return { ...task, completed: newCompleted }
        }
        return task
      }),
    )
  }

  const openResource = (task: GrowthTask) => {
    setSelectedResource(task)
  }

  const completedTasks = tasks.filter((task) => task.completed).length
  const totalTasks = tasks.length
  const progressPercentage = (completedTasks / totalTasks) * 100

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Plan de Crecimiento</h2>
        <Badge className="bg-success text-white text-lg px-4 py-2">
          {completedTasks}/{totalTasks} Completadas
        </Badge>
      </div>

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-success text-white px-8 py-4 rounded-lg shadow-lg animate-bounce">
            🎉 ¡Excelente trabajo! Tarea completada
          </div>
        </div>
      )}

      {/* Progress Section */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-5 h-5 text-mint-dark" />
            Progreso General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Progreso del plan</span>
              <span className="font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-mint-dark to-success h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Tasks */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-gray-900">Tareas de Crecimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <button onClick={() => toggleTask(task.id)} className="mt-1 transition-colors">
                {task.completed ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 hover:text-mint-dark" />
                )}
              </button>

              <div className="flex-1">
                <h4 className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {task.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openResource(task)}
                className="text-mint-dark border-mint-dark hover:bg-mint-dark hover:text-white"
              >
                <BookOpen className="w-4 h-4 mr-1" />
                Explorar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Simulation History */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <MessageSquare className="w-5 h-5 text-mint-dark" />
            Historial de Simulaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockSimulationHistory.map((simulation) => (
            <div key={simulation.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{formatDate(simulation.date)}</span>
                  <Badge variant="outline" className="ml-2 text-gray-700 border-gray-300">
                    {simulation.caseTitle}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={levelColors[simulation.level as keyof typeof levelColors]}>
                    {simulation.level.charAt(0).toUpperCase() + simulation.level.slice(1)}
                  </Badge>
                  <Badge className={simulation.passed ? "bg-success text-white" : "bg-red-500 text-white"}>
                    {simulation.passed ? "Aprobado" : "Necesita Mejora"}
                  </Badge>
                </div>
              </div>

              {/* General Feedback */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-900">Feedback General</h4>
                <p className="text-sm text-gray-700">{simulation.feedback.generalCommentary}</p>
              </div>

              {/* Competency Feedback */}
              <Accordion type="single" collapsible>
                <AccordionItem value={`feedback-${simulation.id}`} className="border-gray-200">
                  <AccordionTrigger className="text-sm text-gray-900 hover:text-mint-dark">
                    Ver Feedback Detallado por Competencias
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {simulation.feedback.competencyFeedback.map((feedback, index) => (
                      <div key={index} className="border-l-4 border-mint-dark pl-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-sm text-gray-900">
                            {competencyNames[feedback.competency as keyof typeof competencyNames]}
                          </h5>
                          <Badge className={levelColors[feedback.achievedLevel as keyof typeof levelColors]}>
                            {feedback.achievedLevel.charAt(0).toUpperCase() + feedback.achievedLevel.slice(1)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="font-medium text-success mb-2 flex items-center gap-1 text-sm">
                              <CheckCircle className="w-3 h-3" />
                              Puntos Fuertes
                            </h6>
                            <ul className="space-y-1">
                              {feedback.strengths.map((strength, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                                  <span className="text-success mt-1">•</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h6 className="font-medium text-orange-600 mb-2 flex items-center gap-1 text-sm">
                              <AlertTriangle className="w-3 h-3" />
                              Áreas de Mejora
                            </h6>
                            <ul className="space-y-1">
                              {feedback.areasForImprovement.map((area, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                                  <span className="text-orange-600 mt-1">•</span>
                                  <span>{area}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded text-xs">
                          <strong className="text-gray-900">Justificación:</strong>{" "}
                          <span className="text-gray-700">{feedback.justification}</span>
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resource Reader Dialog */}
      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] frosted-glass">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-gray-900">
              <span>{selectedResource?.title}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedResource(null)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            {selectedResource?.resourceContent ? (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {selectedResource.resourceContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Contenido del recurso estará disponible próximamente.</p>
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setSelectedResource(null)} className="text-gray-700">
              Cerrar
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-white"
              onClick={() => {
                if (selectedResource) {
                  toggleTask(selectedResource.id)
                  setSelectedResource(null)
                }
              }}
            >
              Marcar como Completada
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
