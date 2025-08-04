"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertTriangle, Target, TrendingUp, Calendar, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { getSessionHistory, getGrowthPlan, toggleTask } from "@/services/api.service"
import type { ISimulationSession, IFeedbackReport, IGrowthTask } from "../../../../packages/types"

// Combinamos los tipos para la data que recibimos del historial enriquecido
type HistoryWithFeedback = ISimulationSession & IFeedbackReport;

// ✅ MISMO MAPEO QUE EN FEEDBACKVIEW
const competencyNames = {
  "enfoque-cliente": "Enfoque en el Cliente y Empatía",
  "enfoque_cliente_empatia": "Enfoque en el Cliente y Empatía",
  regulaciones: "Conocimiento y Aplicación de Regulaciones",
  "conocimiento_regulaciones": "Conocimiento y Aplicación de Regulaciones",
  "resolucion-problemas": "Resolución de Problemas",
  "resolucion_problemas": "Resolución de Problemas",
  "comunicacion-efectiva": "Comunicación Efectiva",
  "comunicacion_efectiva": "Comunicación Efectiva",
  integridad: "Integridad",
}

const levelColors = {
  bronce: "bg-[#CD7F32] text-white",
  BRONCE: "bg-[#CD7F32] text-white",
  plata: "bg-[#C0C0C0] text-gray-800",
  PLATA: "bg-[#C0C0C0] text-gray-800",
  oro: "bg-[#FFD700] text-gray-800",
  ORO: "bg-[#FFD700] text-gray-800",
  platino: "bg-[#E5E4E2] text-gray-800",
  PLATINO: "bg-[#E5E4E2] text-gray-800",
}

// ✅ MISMAS FUNCIONES UTILITARIAS QUE EN FEEDBACKVIEW
const getCompetencyName = (competencySlug: string): string => {
  return competencyNames[competencySlug as keyof typeof competencyNames] || competencySlug;
}

const getLevelColor = (level: string): string => {
  return levelColors[level as keyof typeof levelColors] || "bg-gray-500 text-white";
}

const formatLevel = (level: string): string => {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("es-ES", {
    year: 'numeric', month: 'long', day: 'numeric'
});

export function GrowthPlanView() {
  const [history, setHistory] = useState<HistoryWithFeedback[]>([]);
  const [tasks, setTasks] = useState<IGrowthTask[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const userId = "user123";

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar historial y tareas en paralelo
        const [sessionHistory, growthTasks] = await Promise.all([
          getSessionHistory(userId),
          getGrowthPlan(userId)
        ]);
        
        setHistory(sessionHistory as HistoryWithFeedback[]);
        setTasks(growthTasks);
      } catch (error) {
        console.error("Error al cargar el plan de crecimiento:", error);
      } finally {
        setIsLoadingHistory(false);
        setIsLoadingTasks(false);
      }
    };
    loadData();
  }, []);

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleTask(taskId);
      // Actualizar el estado local
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
    }
  };

  if (isLoadingHistory && isLoadingTasks) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <TrendingUp className="w-8 h-8 text-[#48B5A3]" />
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mi Plan de Crecimiento</h2>
          <p className="text-gray-600">Revisa el feedback detallado de tus simulaciones y gestiona tu plan de desarrollo.</p>
        </div>
      </div>

      {/* Resumen de progreso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#48B5A3]/20">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-[#48B5A3] mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{history.length}</div>
            <div className="text-sm text-gray-600">Simulaciones Completadas</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{history.filter(s => s.passed).length}</div>
            <div className="text-sm text-gray-600">Niveles Aprobados</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{tasks.filter(t => !t.completed).length}</div>
            <div className="text-sm text-gray-600">Tareas Pendientes</div>
          </CardContent>
        </Card>
      </div>

      {/* Plan de Tareas de Crecimiento */}
      {tasks.length > 0 && (
        <Card className="border-[#48B5A3] border-2">
          <CardHeader className="bg-[#48B5A3]/10">
            <CardTitle className="text-[#0A2A4D] flex items-center gap-2">
              <Target className="w-5 h-5" />
              Tu Plan de Tareas de Crecimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {task.description}
                    </p>
                    {task.completed && <p className="text-xs text-green-600 mt-1">✅ Completada</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Progreso:</strong> {tasks.filter(t => t.completed).length} de {tasks.length} tareas completadas
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Simulaciones con Feedback Detallado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Historial Detallado de Simulaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <Accordion type="multiple" className="w-full space-y-4">
              {history.map((session) => (
                <AccordionItem key={session.id} value={session.id} className="border rounded-lg">
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <div className="flex justify-between items-center w-full">
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-800 capitalize">
                          {String(session.case).replace(/-/g, ' ')}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className={getLevelColor(session.level)}>
                            {formatLevel(session.level)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {session.endTime ? formatDate(session.endTime) : formatDate(session.startTime)}
                          </span>
                        </div>
                      </div>
                      <Badge className={session.passed ? "bg-[#2ECC71] text-white" : "bg-red-500 text-white"}>
                        {session.passed ? "Aprobado" : "Necesita Mejora"}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 pt-0 space-y-6">
                    
                    {/* Feedback General */}
                    {session.generalCommentary && (
                      <div className="bg-[#48B5A3]/10 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#0A2A4D] mb-2">Feedback General</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{session.generalCommentary}</p>
                      </div>
                    )}

                    {/* Feedback por Competencias */}
                    {session.competencyFeedback && session.competencyFeedback.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Feedback por Competencias</h4>
                        <div className="space-y-4">
                          {session.competencyFeedback.map((feedback, index) => (
                            <div key={feedback.competency} className="border rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="font-semibold text-gray-800">
                                  {getCompetencyName(feedback.competency)}
                                </span>
                                <Badge className={getLevelColor(feedback.achievedLevel)}>
                                  {formatLevel(feedback.achievedLevel)}
                                </Badge>
                                {feedback.meetsIndicators !== undefined && (
                                  <Badge variant={feedback.meetsIndicators ? "default" : "destructive"}>
                                    {feedback.meetsIndicators ? "✓ Cumple" : "✗ No Cumple"}
                                  </Badge>
                                )}
                              </div>

                              {/* Puntos Fuertes */}
                              {feedback.strengths && feedback.strengths.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="font-medium text-[#2ECC71] mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Puntos Fuertes
                                  </h5>
                                  <ul className="space-y-1">
                                    {feedback.strengths.map((strength, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-sm">
                                        <CheckCircle className="w-3 h-3 text-[#2ECC71] mt-1 flex-shrink-0" />
                                        <span>{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Áreas de Mejora */}
                              {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Áreas de Mejora
                                  </h5>
                                  <ul className="space-y-1">
                                    {feedback.areasForImprovement.map((area, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-sm">
                                        <AlertTriangle className="w-3 h-3 text-orange-600 mt-1 flex-shrink-0" />
                                        <span>{area}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Justificación */}
                              {feedback.justification && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <h5 className="font-medium mb-1">Justificación</h5>
                                  <p className="text-sm text-gray-700">{feedback.justification}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recomendaciones */}
                    {session.recommendations && session.recommendations.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">Recomendaciones de esta Sesión</h4>
                        <div className="space-y-2">
                          {session.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-[#48B5A3] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className="text-sm text-gray-700">{recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes simulaciones completadas para revisar.</p>
              <p className="text-sm text-gray-400 mt-2">Completa algunas simulaciones para ver tu progreso aquí.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}