"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { SimulationView } from "@/components/simulation-view-fullscreen"
import { FeedbackView } from "@/components/feedback-view"
import { CaseBriefingModal } from "@/components/case-briefing-modal"
import { HistoryView } from "@/components/history-view"
import { GrowthPlanView } from "@/components/growth-plan-view" // ✅ NUEVO IMPORT
import { getBriefing, startSession, evaluateSession, getActiveSessions, getSession } from "@/services/api.service"
import type { ICase, ISimulationSession, IFeedbackReport } from "../../../../packages/types"

const mockUser = {
  id: "user123",
  name: "María González",
  avatar: "/placeholder.svg",
}

export type View = "dashboard" | "simulation" | "feedback" | "history" | "growth-plan"

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [isBriefingOpen, setIsBriefingOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<ICase | null>(null)
  const [briefingText, setBriefingText] = useState<string>("")
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false)
  
  // ✅ ESTADO EXISTENTE: Sesión activa de simulación
  const [activeSession, setActiveSession] = useState<ISimulationSession | null>(null)
  const [isStartingSession, setIsStartingSession] = useState(false)
  
  // ✅ ESTADO ACTUALIZADO: Todas las sesiones activas
  const [activeSessions, setActiveSessions] = useState<ISimulationSession[]>([])
  const [pendingSession, setPendingSession] = useState<ISimulationSession | null>(null)
  
  // ✅ ESTADO PARA EL SIDEBAR EN SIMULACIÓN
  const [sidebarVisible, setSidebarVisible] = useState(true)

  // ✅ ESTADOS PARA EVALUACIÓN
  const [feedbackReport, setFeedbackReport] = useState<IFeedbackReport | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const userId = mockUser.id; // ID del usuario

  // ✅ EFECTO ACTUALIZADO: Cargar todas las sesiones activas
  useEffect(() => {
    // Esta función se ejecutará solo cuando se cargue el dashboard
    if (currentView === 'dashboard') {
      const loadDashboardData = async () => {
        try {
          console.log("🔍 Buscando sesiones activas para el usuario:", userId);
          
          // ✅ CAMBIO: Guardar TODAS las sesiones activas
          const allActiveSessions = await getActiveSessions(userId);
          setActiveSessions(allActiveSessions); // ✅ NUEVO: Guardar todas las sesiones
          
          if (allActiveSessions.length > 0) {
            console.log(`📋 Se encontraron ${allActiveSessions.length} sesiones activas`);
            setPendingSession(allActiveSessions[0]); // Mantener la primera para el caso sugerido
            console.log("✅ Sesión pendiente guardada:", allActiveSessions[0].id);
          } else {
            console.log("✅ No se encontraron sesiones activas");
            setPendingSession(null);
            setActiveSessions([]); // ✅ NUEVO: Limpiar array
          }
        } catch (error) {
          console.error("❌ Error al cargar datos del dashboard:", error);
          setPendingSession(null);
          setActiveSessions([]); // ✅ NUEVO: Limpiar en caso de error
        }
      };
      
      loadDashboardData();
    }
  }, [currentView, userId]); // Se ejecuta cada vez que cambia la vista o el usuario

  // --- FUNCIÓN EXISTENTE (sin cambios) ---
  const handleStartSimulation = async (caseData: ICase) => {
    console.log(`1. Clic en Dashboard para el caso: ${caseData.title}`);
    setSelectedCase(caseData)
    setIsLoadingBriefing(true)
    setIsBriefingOpen(true)

    try {
      console.log("2. Llamando a la API para obtener el briefing...");
      const response = await getBriefing(caseData.id, caseData.currentLevel ?? 'bronce');
      setBriefingText(response.briefing);
      console.log("3. Briefing recibido y guardado en el estado.");
    } catch (error) {
      console.error("Error al obtener el briefing:", error)
      setBriefingText("Hubo un error al cargar la descripción de la misión. Por favor, intenta de nuevo.")
    } finally {
      setIsLoadingBriefing(false)
    }
  }

  // ✅ FUNCIÓN EXISTENTE (sin cambios)
  const handleConfirmStart = async () => {
    if (!selectedCase) {
      console.error("❌ No hay caso seleccionado para iniciar la simulación");
      return;
    }

    console.log("4. Simulación confirmada. Creando sesión en la base de datos...");
    setIsStartingSession(true);

    try {
      // ✅ Llamar a la API para crear la sesión usando el slug del caso
      const caseSlug = selectedCase.slug || selectedCase.id; // Usar slug si existe, sino id
      const newSession = await startSession(caseSlug, mockUser.id);
      
      console.log("5. ✅ Sesión creada exitosamente:", newSession.id);
      
      // ✅ Guardar la sesión activa y cambiar de vista
      setActiveSession(newSession);
      setCurrentView("simulation");
      setIsBriefingOpen(false);

      console.log("6. 🎯 Vista cambiada a simulación. Sesión activa:", newSession.id);

    } catch (error) {
      console.error("❌ Error al confirmar e iniciar la simulación:", error);
      alert(`Error al iniciar la simulación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsStartingSession(false);
    }
  }

  // ✅ FUNCIÓN EXISTENTE: Continuar una simulación existente
  const handleContinueSimulation = async (sessionToContinue: ISimulationSession) => {
    try {
      console.log("🔄 Continuando simulación existente:", sessionToContinue.id);
      
      // Obtenemos el estado completo de la sesión, incluyendo el historial de chat
      const fullSession = await getSession(sessionToContinue.id);
      
      console.log("✅ Sesión completa obtenida con", fullSession.conversationHistory.length, "mensajes");
      
      setActiveSession(fullSession);
      setCurrentView("simulation");
      setPendingSession(null); // Limpiamos la sesión pendiente al continuarla
      
      console.log("🎯 Vista cambiada a simulación (continuando)");
      
    } catch (error) {
      console.error("❌ Error al continuar la sesión:", error);
      alert(`Error al continuar la simulación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  // ✅ FUNCIÓN ACTUALIZADA: Limpiar sesiones al volver
  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setActiveSession(null);
    setFeedbackReport(null);
    setPendingSession(null);
    setActiveSessions([]); // ✅ NUEVO: Limpiar todas las sesiones activas
    setSidebarVisible(true);
    console.log("🔙 Regresando al dashboard");
  }

  // ✅ FUNCIÓN EXISTENTE (sin cambios)
  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  }

  // ✅ FUNCIÓN EXISTENTE: Manejar evaluación
  const handleEvaluation = async () => {
    if (!activeSession) {
      console.error("❌ No hay sesión activa para evaluar");
      return;
    }

    console.log("🎯 Iniciando evaluación de la simulación...");
    setIsEvaluating(true);
    
    try {
      const report = await evaluateSession(activeSession.id);
      console.log("✅ Evaluación completada:", report);
      
      setFeedbackReport(report);
      setCurrentView("feedback");
      
    } catch (error) {
      console.error("❌ Error al obtener el feedback:", error);
      alert(`Error al evaluar la simulación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  // ✅ FUNCIÓN EXISTENTE: Reintentar simulación desde feedback
  const handleRetrySimulation = () => {
    if (!selectedCase) {
      console.log("❌ No hay caso seleccionado para reintentar");
      return;
    }
    
    console.log("🔄 Reintentando simulación...");
    setFeedbackReport(null);
    setActiveSession(null);
    
    // Volver a iniciar el flujo de simulación
    handleStartSimulation(selectedCase);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={mockUser} />
      <div className="flex">
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => setCurrentView(view)} 
          cases={[]} // El dashboard ya obtiene sus propios datos
        />
        <main className="flex-1 ml-[280px] mt-16 p-6">
          {currentView === 'dashboard' && (
            <Dashboard 
              onStartSimulation={handleStartSimulation}
              pendingSession={pendingSession}
              activeSessions={activeSessions} // ✅ NUEVO: Pasar todas las sesiones activas
              onContinueSimulation={handleContinueSimulation}
            />
          )}

          {currentView === 'simulation' && activeSession && (
            <SimulationView
              session={activeSession}
              onComplete={handleEvaluation}
              onBack={handleBackToDashboard}
              onToggleSidebar={handleToggleSidebar}
              sidebarVisible={sidebarVisible}
              isEvaluating={isEvaluating}
            />
          )}

          {currentView === 'feedback' && feedbackReport && (
            <FeedbackView
              report={feedbackReport}
              onBack={handleBackToDashboard}
              onRetry={handleRetrySimulation}
            />
          )}

          {/* ✅ VISTA EXISTENTE */}
          {currentView === 'history' && <HistoryView />}

          {/* ✅ REEMPLAZAMOS EL PLACEHOLDER CON EL COMPONENTE REAL */}
          {currentView === "growth-plan" && <GrowthPlanView />}
        </main>
      </div>

      <CaseBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        onStart={handleConfirmStart}
        caseData={selectedCase}
        briefingContent={isLoadingBriefing ? "Generando misión..." : briefingText}
      />
    </div>
  )
}