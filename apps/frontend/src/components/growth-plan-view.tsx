"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertTriangle, Target, TrendingUp, Calendar, Award, Clock } from "lucide-react"
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

// Tipo para tareas organizadas
type OrganizedTask = IGrowthTask & {
  sessionData?: HistoryWithFeedback;
  caseTitle?: string;
  sessionDate?: Date;
};

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

const formatCaseTitle = (caseSlug: string): string => {
  return String(caseSlug).replace(/-/g, ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// ✅ FUNCIÓN MEJORADA para vincular tareas con sesiones
const findSessionForTask = (task: IGrowthTask, sessions: HistoryWithFeedback[]): HistoryWithFeedback | undefined => {
  if (!task.sourceSessionId) {
    console.log(`⚠️ Tarea ${task.id} no tiene sourceSessionId`);
    return undefined;
  }
  
  // Extraer el ID limpio de diferentes formatos posibles
  let taskSessionId = String(task.sourceSessionId);
  
  // Remover prefijo 'session:' si existe
  if (taskSessionId.startsWith('session:')) {
    taskSessionId = taskSessionId.replace('session:', '');
  }
  
  console.log(`🔍 Buscando sesión para tarea ${task.id}, sourceSessionId: ${task.sourceSessionId}, limpio: ${taskSessionId}`);
  
  // Buscar la sesión correspondiente
  const foundSession = sessions.find(session => {
    const sessionId = String(session.id);
    
    // Intentar diferentes comparaciones
    const matches = sessionId === taskSessionId || 
                   sessionId.endsWith(taskSessionId) ||
                   taskSessionId.endsWith(sessionId) ||
                   sessionId.includes(taskSessionId) ||
                   taskSessionId.includes(sessionId);
    
    if (matches) {
      console.log(`✅ Match encontrado: sesión ${sessionId} para tarea ${task.id}`);
    }
    
    return matches;
  });
  
  if (!foundSession) {
    console.log(`❌ No se encontró sesión para tarea ${task.id}`);
    console.log(`📊 Sesiones disponibles:`, sessions.map(s => s.id));
  }
  
  return foundSession;
};

export function GrowthPlanView() {
  const [history, setHistory] = useState<HistoryWithFeedback[]>([]);
  const [tasks, setTasks] = useState<IGrowthTask[]>([]);
  const [organizedTasks, setOrganizedTasks] = useState<{ [key: string]: OrganizedTask[] }>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const userId = "user123";

  // ✅ useEffect MEJORADO con logs detallados
  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 GrowthPlanView: Iniciando carga de datos...');
      
      try {
        // Cargar historial y tareas en paralelo
        const [sessionHistory, growthTasks] = await Promise.all([
          getSessionHistory(userId),
          getGrowthPlan(userId)
        ]);
        
        console.log('📊 GrowthPlanView: Datos cargados:', {
          sessions: sessionHistory.length,
          tasks: growthTasks.length,
          tasksWithSource: growthTasks.filter(t => t.sourceSessionId).length
        });
        
        setHistory(sessionHistory as HistoryWithFeedback[]);
        setTasks(growthTasks);

        // Organizar tareas por caso y fecha con función mejorada
        const organized: { [key: string]: OrganizedTask[] } = {};
        
        growthTasks.forEach((task, index) => {
          console.log(`🔗 Procesando tarea ${index + 1}/${growthTasks.length}:`, {
            id: task.id,
            sourceSessionId: task.sourceSessionId,
            description: task.description.substring(0, 50) + '...'
          });
          
          // Usar la función mejorada para encontrar la sesión
          const sessionData = findSessionForTask(task, sessionHistory as HistoryWithFeedback[]);
          
          const caseTitle = sessionData ? formatCaseTitle(sessionData.case) : 'Tareas Generales';
          const sessionDate = sessionData ? 
            new Date(sessionData.endTime || sessionData.startTime) : 
            new Date(task.createdAt);
          
          const key = `${caseTitle} - ${formatDate(sessionDate)}`;
          
          if (!organized[key]) {
            organized[key] = [];
          }
          
          organized[key].push({
            ...task,
            sessionData,
            caseTitle,
            sessionDate
          });
        });

        // Ordenar cada grupo por fecha de creación
        Object.keys(organized).forEach(key => {
          organized[key].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setOrganizedTasks(organized);
        console.log('✅ GrowthPlanView: Tareas organizadas:', {
          grupos: Object.keys(organized).length,
          distribución: Object.entries(organized).map(([key, tasks]) => ({
            grupo: key,
            tareas: tasks.length
          }))
        });
        
      } catch (error) {
        console.error("❌ GrowthPlanView: Error al cargar datos:", error);
      } finally {
        setIsLoadingHistory(false);
        setIsLoadingTasks(false);
      }
    };
    
    loadData();
  }, [userId]);

  // ✅ handleToggleTask MEJORADO con optimistic updates
  const handleToggleTask = async (taskId: string) => {
    console.log(`🔄 GrowthPlanView: Toggleando tarea ${taskId}`);
    
    // Optimistic update
    const updateTasksOptimistically = (completed: boolean) => {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed } : task
      ));
      
      setOrganizedTasks(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(task => 
            task.id === taskId ? { ...task, completed } : task
          );
        });
        return updated;
      });
    };

    // Encontrar tarea actual para optimistic update
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) {
      console.error(`❌ No se encontró tarea con ID ${taskId}`);
      return;
    }

    const newCompletedState = !currentTask.completed;
    
    // Update optimista
    updateTasksOptimistically(newCompletedState);

    try {
      await toggleTask(taskId);
      console.log(`✅ GrowthPlanView: Tarea ${taskId} actualizada exitosamente`);
    } catch (error) {
      console.error("❌ GrowthPlanView: Error al actualizar la tarea:", error);
      
      // Revertir cambio optimista
      updateTasksOptimistically(currentTask.completed);
      
      // Mostrar error al usuario
      alert('Error al actualizar la tarea. Inténtalo de nuevo.');
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

      {/* Plan de Tareas de Crecimiento Organizadas por Caso y Fecha */}
      {Object.keys(organizedTasks).length > 0 && (
        <Card className="border-[#48B5A3] border-2">
          <CardHeader className="bg-[#48B5A3]/10">
            <CardTitle className="text-[#0A2A4D] flex items-center gap-2">
              <Target className="w-5 h-5" />
              Plan de Tareas Organizadas por Simulación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {Object.entries(organizedTasks)
                .sort(([,a], [,b]) => {
                  const dateA = a[0]?.sessionDate || new Date(a[0]?.createdAt);
                  const dateB = b[0]?.sessionDate || new Date(b[0]?.createdAt);
                  return new Date(dateB).getTime() - new Date(dateA).getTime();
                })
                .map(([groupKey, groupTasks]) => (
                <div key={groupKey} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-[#48B5A3]" />
                    <h3 className="font-semibold text-gray-800">{groupKey}</h3>
                    {groupTasks[0]?.sessionData && (
                      <Badge className={getLevelColor(groupTasks[0].sessionData.level)}>
                        {formatLevel(groupTasks[0].sessionData.level)}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {groupTasks.filter(t => t.completed).length} / {groupTasks.length} completadas
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {groupTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
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
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Progreso Total:</strong> {tasks.filter(t => t.completed).length} de {tasks.length} tareas completadas
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mostrar mensaje si no hay tareas */}
      {Object.keys(organizedTasks).length === 0 && !isLoadingTasks && (
        <Card className="border-[#48B5A3] border-2">
          <CardContent className="p-8 text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No tienes tareas de crecimiento aún</h3>
            <p className="text-gray-500">Completa algunas simulaciones para generar tu plan personalizado de desarrollo.</p>
          </CardContent>
        </Card>
      )}

      {/* Historial de Simulaciones con Feedback Expandido */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Historial Detallado de Simulaciones
        </h3>

        {history.length > 0 ? (
          history.map((session) => (
            <Card key={session.id} className="border-2">
              {/* Header de la sesión */}
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {formatCaseTitle(session.case)}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
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
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Feedback General */}
                {session.generalCommentary && (
                  <Card className="border-[#48B5A3] border-2">
                    <CardHeader className="bg-[#48B5A3]/10">
                      <CardTitle className="text-[#0A2A4D]">Feedback General</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-gray-700 leading-relaxed">{session.generalCommentary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Feedback por Competencias - CON ACORDEONES COMO FEEDBACKVIEW */}
                {session.competencyFeedback && session.competencyFeedback.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Feedback por Competencias</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full">
                        {session.competencyFeedback.map((feedback, index) => (
                          <AccordionItem key={feedback.competency} value={`competency-${index}`}>
                            <AccordionTrigger className="text-left">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">
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
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-[#2ECC71] mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Puntos Fuertes
                                </h4>
                                <ul className="space-y-1">
                                  {feedback.strengths.map((strength, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Áreas de Mejora
                                </h4>
                                <ul className="space-y-1">
                                  {feedback.areasForImprovement.map((area, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                      <span>{area}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Justificación</h4>
                                <p className="text-sm text-gray-700">{feedback.justification}</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )}

                {/* Recomendaciones - CON ACORDEÓN COMO FEEDBACKVIEW */}
                {session.recommendations && session.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Plan de Crecimiento de esta Sesión</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="recommendations">
                          <AccordionTrigger>Ver Plan de Crecimiento de esta Sesión</AccordionTrigger>
                          <AccordionContent className="space-y-3">
                            {session.recommendations.map((recommendation, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                <div className="w-6 h-6 bg-[#48B5A3] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm">{recommendation}</p>
                                  <Button variant="link" className="p-0 h-auto text-[#48B5A3] text-sm">
                                    Acceder al recurso →
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes simulaciones completadas para revisar.</p>
              <p className="text-sm text-gray-400 mt-2">Completa algunas simulaciones para ver tu progreso aquí.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}