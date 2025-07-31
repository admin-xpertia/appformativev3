"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Circle, BarChart3, BookOpen, X, Calendar, MessageSquare, AlertTriangle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getGrowthPlan, toggleTask, getSessionHistory } from "@/services/api.service" // ✅ Importamos los nuevos servicios
import type { IGrowthTask, ISimulationSession } from "../../../../packages/types" // ✅ Importamos los tipos reales
import { Skeleton } from "@/components/ui/skeleton"

// Diccionarios para nombres y colores (se mantienen igual)
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
  // --- ESTADOS CON DATOS REALES ---
  const [tasks, setTasks] = useState<IGrowthTask[]>([]);
  const [history, setHistory] = useState<ISimulationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<IGrowthTask | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const userId = "user123"; // Hardcodeado por ahora

  // --- FUNCIÓN PARA CARGAR DATOS DESDE LA API ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [growthTasks, sessionHistory] = await Promise.all([
        getGrowthPlan(userId),
        getSessionHistory(userId)
      ]);
      setTasks(growthTasks);
      setHistory(sessionHistory);
    } catch (error) {
      console.error("Error al cargar los datos del Plan de Crecimiento:", error);
      // Aquí podrías mostrar una notificación de error al usuario
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- FUNCIÓN PARA MARCAR TAREAS COMO COMPLETADAS ---
  const handleToggleTask = async (taskId: string) => {
    const originalTasks = [...tasks];
    // Optimistic UI update
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));

    try {
      await toggleTask(taskId);
      // Opcional: Refrescar los datos para asegurar consistencia
      // await loadData(); 
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
      setTasks(originalTasks); // Revertir en caso de error
    }
  };

  const completedTasks = tasks.filter((task) => task.completed).length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric", month: "long", day: "numeric",
    })
  }
  
  if (isLoading) {
    return <Skeleton className="h-96 w-full" />; // Muestra un esqueleto de carga
  }

  return (
    <div className="space-y-8">
      {/* ... (El resto de tu JSX se mantiene casi igual, solo cambia el origen de los datos) ... */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Plan de Crecimiento</h2>
        {totalTasks > 0 && (
          <Badge className="bg-success text-white text-lg px-4 py-2">
            {completedTasks}/{totalTasks} Completadas
          </Badge>
        )}
      </div>
      
      {/* ... (Animación de celebración no cambia) ... */}

      {/* Progress Section */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Progreso General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-mint-dark to-success h-3 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
      
      {/* Growth Tasks */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Tareas de Crecimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length > 0 ? tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-4 p-4 border rounded-lg">
              <button onClick={() => handleToggleTask(task.id)}>
                {task.completed ? <CheckCircle className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-gray-400" />}
              </button>
              <div className="flex-1">
                <h4 className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {task.description}
                </h4>
              </div>
              {/* Lógica para "Explorar" pendiente */}
            </div>
          )) : <p className="text-gray-500">Aún no tienes tareas de crecimiento. ¡Completa una simulación para generarlas!</p>}
        </CardContent>
      </Card>
      
      {/* Simulation History */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Historial de Simulaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length > 0 ? history.map((simulation) => (
            <div key={simulation.id} className="border rounded-lg p-4">
              {/* ... (Renderizado del historial usa `simulation` en lugar de `mockSimulationHistory`) ... */}
            </div>
          )) : <p className="text-gray-500">No hay simulaciones en tu historial.</p>}
        </CardContent>
      </Card>

      {/* ... (El Dialog para el recurso no cambia) ... */}
    </div>
  )
}