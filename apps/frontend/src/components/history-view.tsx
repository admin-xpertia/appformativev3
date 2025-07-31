// En apps/frontend/src/components/history-view.tsx
"use client"

import { useState, useEffect } from "react";
import { getSessionHistory } from "@/services/api.service";
import type { ISimulationSession } from "../../../../packages/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const formatDate = (date: Date) => new Date(date).toLocaleDateString("es-ES", {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
});

// ✅ ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ EXACTAMENTE ASÍ
export function HistoryView() {
  const [history, setHistory] = useState<ISimulationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = "user123"; // Hardcodeado por ahora

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const sessionHistory = await getSessionHistory(userId);
        setHistory(sessionHistory);
      } catch (error) {
        console.error("Error al cargar el historial:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (history.length === 0) {
    return <p>Aún no tienes simulaciones completadas en tu historial.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Historial de Simulaciones</h2>
      {history.map(session => (
        <Card key={session.id} className="card-elevated hover:border-mint-dark/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 capitalize">{String(session.case).replace(/-/g, ' ')}</h3>
                <p className="text-sm text-gray-500">
                  Nivel: <span className="font-medium capitalize">{session.level}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Finalizada el: {session.endTime ? formatDate(session.endTime) : 'N/A'}
                </p>
              </div>
              <Badge className={session.passed ? "bg-success text-white" : "bg-red-500 text-white"}>
                {session.passed ? "Aprobado" : "Necesita Mejora"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}