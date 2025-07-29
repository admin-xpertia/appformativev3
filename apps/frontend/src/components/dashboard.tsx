"use client"

import { useState, useEffect } from "react"
import { CompetencyProgress } from "@/components/competency-progress"
import { JourneyCard } from "@/components/journey-card"
import { SuggestedChallenge } from "@/components/suggested-challenge"
import { getCases, getUserProgress } from "@/services/api.service"
import type { ICase, ICompetencyProgress } from "../../../../packages/types"

interface DashboardProps {
  onStartSimulation: (caseData: ICase) => void;
}

const competencyNames: { [key: string]: string } = {
  "enfoque-cliente": "Enfoque en el Cliente y Empatía",
  "regulaciones": "Conocimiento y Aplicación de Regulaciones",
  "resolucion-problemas": "Resolución de Problemas",
  "comunicacion-efectiva": "Comunicación Efectiva",
  "integridad": "Integridad",
}

export function Dashboard({ onStartSimulation }: DashboardProps) {
  const [cases, setCases] = useState<ICase[]>([]);
  const [competencies, setCompetencies] = useState<ICompetencyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesData, progressData] = await Promise.all([
          getCases(),
          getUserProgress("user123")
        ]);
        setCases(casesData);
        setCompetencies(progressData);
      } catch (error) {
        console.error("Error al cargar los datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-12 text-center">Cargando tu espacio de maestría...</div>;
  }

  if (!cases || cases.length === 0) {
    return <div className="p-12 text-center">No hay casos de simulación disponibles.</div>;
  }

  // Sugerir un caso incompleto o el primero
  const suggestedCase = cases.find((c) => (c.progress ?? 0) < 100 && c.available) || cases[0];

  return (
    <div className="space-y-12 animate-fade-in">
      <section className="mb-12">
        {suggestedCase && (
          <SuggestedChallenge
            case={suggestedCase}
            onStart={() => onStartSimulation(suggestedCase)}
          />
        )}
      </section>

      <section>
        <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">Tu Maestría</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {competencies.map((competency) => (
            <CompetencyProgress
              key={competency.competency}
              name={competencyNames[competency.competency]}
              progress={competency.progress}
              level={competency.level}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">Otros Viajes</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {cases
            .filter((c) => c.id !== suggestedCase.id)
            .map((caseItem) => (
              <div key={caseItem.id} className="flex-shrink-0 w-80">
                <JourneyCard
                  case={caseItem}
                  onStart={() => onStartSimulation(caseItem)}
                />
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}
