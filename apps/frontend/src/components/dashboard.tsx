"use client"

import { useState, useEffect } from "react"
import { CompetencyProgress } from "@/components/competency-progress"
import { JourneyCard } from "@/components/journey-card"
import { SuggestedChallenge } from "@/components/suggested-challenge"
import { getCases, getUserProgress } from "@/services/api.service"
import type { ICase, ICompetencyProgress } from "../../../../packages/types"

const competencyNames: { [key: string]: string } = {
  "enfoque-cliente": "Enfoque en el Cliente y Empatía",
  "regulaciones": "Conocimiento y Aplicación de Regulaciones",
  "resolucion-problemas": "Resolución de Problemas",
  "comunicacion-efectiva": "Comunicación Efectiva",
  "integridad": "Integridad",
}

export function Dashboard() {
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

  // --- INICIO DE LA CORRECCIÓN 1 ---
  // Hacemos la búsqueda del caso sugerido más segura, asegurándonos
  // de que las propiedades `progress` y `available` existan antes de usarlas.
  const suggestedCase = cases.find((c) => (c.progress ?? 0) < 100 && c.available) || cases[0];
  // --- FIN DE LA CORRECCIÓN 1 ---

  const onStartSimulation = (caseId: string) => {
    console.log("Iniciando simulación para el caso:", caseId);
  };

  return (
    <div className="space-y-12 animate-fade-in">
       <section className="mb-12">
         {/* * --- NOTA IMPORTANTE PARA LA CORRECCIÓN 2 ---
           * Los errores de tipo restantes ocurren porque `suggestedCase` (que es de tipo ICase)
           * no coincide exactamente con las props que espera el componente `SuggestedChallenge`.
           * La solución ideal es modificar las props de `SuggestedChallenge` para que acepte `ICase`.
           * Como solución temporal aquí, nos aseguramos de no pasarle un valor nulo.
           */}
         {suggestedCase && (
           <SuggestedChallenge case={suggestedCase} onStart={() => onStartSimulation(suggestedCase.id)} />
         )}
       </section>

       <section>
         <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">Tu Maestría</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
           {competencies.map((competency) => (
             <div key={competency.competency}>
               <CompetencyProgress
                 name={competencyNames[competency.competency]}
                 progress={competency.progress}
                 level={competency.level}
               />
             </div>
           ))}
         </div>
       </section>

       <section>
         <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">Otros Viajes</h2>
         <div className="flex gap-6 overflow-x-auto pb-4">
           {cases
             .filter((c) => c.id !== suggestedCase.id)
             .map((case_) => (
               <div key={case_.id} className="flex-shrink-0 w-80">
                 {/*
                   * --- NOTA IMPORTANTE PARA LA CORRECCIÓN 3 ---
                   * El mismo problema ocurre aquí con `JourneyCard`. La solución a largo plazo
                   * es actualizar las props de `JourneyCard` para que sean compatibles con `ICase`.
                   */}
                 <JourneyCard case={case_} onStart={() => onStartSimulation(case_.id)} />
               </div>
             ))}
         </div>
       </section>
    </div>
  );
}