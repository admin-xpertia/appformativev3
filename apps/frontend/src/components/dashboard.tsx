"use client"

import { useState, useEffect } from "react"
import { CompetencyProgress } from "@/components/competency-progress"
import { JourneyCard } from "@/components/journey-card"
import { SuggestedChallenge } from "@/components/suggested-challenge"
import { ContinueChallenge } from "@/components/continue-challenge"
import { getCases, getUserProgress } from "@/services/api.service"
import type { ICase, ICompetencyProgress, ISimulationSession } from "../../../../packages/types"

interface DashboardProps {
  onStartSimulation: (caseData: ICase) => void;
  pendingSession: ISimulationSession | null;
  onContinueSimulation: (session: ISimulationSession) => void;
  activeSessions: ISimulationSession[]; // ✅ USAR ESTA PROP
}

const competencyNames: { [key: string]: string } = {
  "enfoque-cliente": "Enfoque en el Cliente y Empatía",
  regulaciones: "Conocimiento y Aplicación de Regulaciones",
  "resolucion-problemas": "Resolución de Problemas",
  "comunicacion-efectiva": "Comunicación Efectiva",
  integridad: "Integridad",
}

export function Dashboard({ 
  onStartSimulation, 
  pendingSession, 
  onContinueSimulation, 
  activeSessions // ✅ AGREGAR EL PARÁMETRO
}: DashboardProps) {
  const [cases, setCases] = useState<ICase[]>([]);
  const [competencies, setCompetencies] = useState<ICompetencyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [casesData, progressData] = await Promise.all([
          getCases("user123"),
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

  // ✅ NUEVA FUNCIÓN: Marcar casos que están en progreso
  const enrichCasesWithSessionStatus = (cases: ICase[]): ICase[] => {
    return cases.map(caseItem => {
      // Buscar si este caso tiene una sesión activa
      const activeSession = activeSessions.find(session => 
        session.case === caseItem.id || session.case === caseItem.slug
      );

      // Si tiene sesión activa, marcar como "in_progress"
      if (activeSession) {
        return {
          ...caseItem,
          status: 'in_progress' as const
        };
      }

      // Si no tiene sesión activa, dejar status como undefined (disponible)
      return {
        ...caseItem,
        status: undefined // Esto indica que está disponible
      };
    });
  };

  // Wrapper para manejar el estado de carga al continuar
  const handleContinueSimulation = async (session: ISimulationSession) => {
    setIsContinuing(true);
    try {
      await onContinueSimulation(session);
    } catch (error) {
      console.error("Error al continuar simulación:", error);
    } finally {
      setIsContinuing(false);
    }
  };

  // ✅ FUNCIÓN CORREGIDA: Continuar sesión específica para un caso
  const handleContinueSpecificCase = async (caseItem: ICase) => {
    // Buscar la sesión activa para este caso específico
    const sessionForCase = activeSessions.find(session => 
      session.case === caseItem.id || session.case === caseItem.slug
    );
    
    if (sessionForCase) {
      console.log('Continuando sesión para caso:', caseItem.id, 'con sesión:', sessionForCase.id);
      await handleContinueSimulation(sessionForCase);
    } else {
      console.error('No se encontró sesión activa para el caso:', caseItem.id);
      // Si no hay sesión activa, iniciar nueva
      onStartSimulation(caseItem);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu espacio de maestría...</p>
        </div>
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No hay casos de simulación disponibles.</p>
        </div>
      </div>
    );
  }

  // ✅ ENRIQUECER casos con información de sesiones activas
  const enrichedCases = enrichCasesWithSessionStatus(cases);

  // Identificar el caso sugerido (incompleto y disponible, o el primero)
  const suggestedCase = enrichedCases.find((c) => (c.progress ?? 0) < 100 && c.available) || enrichedCases[0];

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Sección de Caso Sugerido o Continuación */}
      <section className="mb-12">
        {pendingSession ? (
          <ContinueChallenge 
            session={pendingSession} 
            onContinue={handleContinueSimulation}
            isContinuing={isContinuing}
          />
        ) : (
          suggestedCase && (
            <SuggestedChallenge
              case={suggestedCase}
              onStart={() => onStartSimulation(suggestedCase)}
            />
          )
        )}
      </section>

      {/* Sección de Competencias */}
      <section>
        <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">
          Tu Maestría
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {competencies.map((competency) => (
            <CompetencyProgress
              key={competency.competency}
              name={competencyNames[competency.competency as keyof typeof competencyNames]}
              progress={competency.progress}
              level={competency.level}
            />
          ))}
        </div>
      </section>

      {/* Sección de Todos los Viajes */}
      <section>
        <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">
          Todos los Viajes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* ✅ CORRECCIÓN PRINCIPAL: Pasar todas las props requeridas */}
          {enrichedCases.map((caseItem) => {
            // Verificar si este caso específico tiene una sesión activa
            const activeSessionForCase = activeSessions.find(session => 
              session.case === caseItem.id || session.case === caseItem.slug
            );

            return (
              <JourneyCard 
                key={caseItem.id}
                case={caseItem} 
                onStart={() => onStartSimulation(caseItem)}
                onContinue={() => handleContinueSpecificCase(caseItem)}
                isHighlighted={caseItem.id === suggestedCase?.id && !pendingSession} // ✅ PROP REQUERIDA
              />
            );
          })}
        </div>
      </section>
    </div>
  )
}