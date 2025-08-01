"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Circle, BarChart3, BookOpen, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getGrowthPlan, toggleTask } from "@/services/api.service"
import type { IGrowthTask } from "../../../../packages/types"
import { Skeleton } from "@/components/ui/skeleton"

export function GrowthPlanView() {
  const [tasks, setTasks] = useState<IGrowthTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  
  const userId = "user123"; // Hardcoded for now

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const growthTasks = await getGrowthPlan(userId);
        setTasks(growthTasks);
      } catch (error) {
        console.error("Error al cargar el Plan de Crecimiento:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleToggleTask = async (taskId: string) => {
    setUpdatingTaskId(taskId);
    try {
      await toggleTask(taskId);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Plan de Crecimiento</h2>
        {totalTasks > 0 && (
          <Badge className="bg-success text-white text-lg px-4 py-2">
            {completedTasks}/{totalTasks} Completadas
          </Badge>
        )}
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-5 h-5 text-mint-dark" />
            Progreso General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-mint-dark to-success h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-gray-900">Tareas de Crecimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length > 0 ? tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <button onClick={() => handleToggleTask(task.id)} disabled={updatingTaskId === task.id}>
                {updatingTaskId === task.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : task.completed ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 hover:text-mint-dark" />
                )}
              </button>
              <div className="flex-1">
                <p className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {task.description}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aún no tienes tareas de crecimiento.</p>
                <p className="text-sm">Completa una simulación para que la IA genere recomendaciones personalizadas para ti.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}