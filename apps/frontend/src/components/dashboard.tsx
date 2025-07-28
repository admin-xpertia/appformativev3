"use client"

import { useState, useEffect } from "react"
import { CompetencyProgress } from "@/components/competency-progress"
import { JourneyCard } from "@/components/journey-card"
import { SuggestedChallenge } from "@/components/suggested-challenge"
import { getCases, getUserProgress } from "@/services/api.service"
// ¡Importamos los tipos correctos desde nuestro paquete compartido!
import type { ICase, ICompetencyProgress } from "../../../../packages/types"

// Este diccionario para los nombres se mantiene igual
const competencyNames: { [key: string]: string } = {
  "enfoque-cliente": "Enfoque en el Cliente y Empatía",
  "regulaciones": "Conocimiento y Aplicación de Regulaciones",
  "resolucion-problemas": "Resolución de Problemas",
  "comunicacion-efectiva": "Comunicación Efectiva",
  "integridad": "Integridad",
}

export function Dashboard() {
  // Ahora los estados usan los tipos importados, eliminando los locales
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
        setCompetencies(progressData); // ¡Ahora los tipos coinciden perfectamente!
      } catch (error) {
        console.error("Error al cargar los datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Cargando tu espacio de maestría...</div>;
  }

  const suggestedCase = cases.find((c) => c.progress < 100 && c.available) || cases[0];

  const onStartSimulation = (caseId: string) => {
    console.log("Iniciando simulación para el caso:", caseId);
  };

  return (
    // El JSX no necesita cambios, ya que las propiedades de los objetos de datos
    // (como 'progress', 'level', 'title') siguen siendo las mismas.
    <div className="space-y-12 animate-fade-in">
       <section className="mb-12">
         <SuggestedChallenge case={suggestedCase} onStart={() => onStartSimulation(suggestedCase.id)} />
       </section>

       <section>
         <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">Tu Maestría</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
           {competencies.map((competency, index) => (
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
                 <JourneyCard case={case_} onStart={() => onStartSimulation(case_.id)} />
               </div>
             ))}
         </div>
       </section>
    </div>
  );
}