"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { SimulationView } from "@/components/simulation-view-fullscreen"
import { FeedbackView } from "@/components/feedback-view" // ✅ NUEVO: Importamos FeedbackView
import { CaseBriefingModal } from "@/components/case-briefing-modal"
import { getBriefing, startSession, evaluateSession } from "@/services/api.service" // ✅ Importamos evaluateSession
import type { ICase, ISimulationSession, IFeedbackReport } from "../../../../packages/types" // ✅ Importamos IFeedbackReport

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
  
  // ✅ ESTADO PARA EL SIDEBAR EN SIMULACIÓN
  const [sidebarVisible, setSidebarVisible] = useState(true)

  // ✅ NUEVOS ESTADOS PARA EVALUACIÓN
  const [feedbackReport, setFeedbackReport] = useState<IFeedbackReport | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

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
      // TODO: Aquí podrías mostrar una notificación de error al usuario
      alert(`Error al iniciar la simulación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsStartingSession(false);
    }
  }

  // ✅ FUNCIÓN EXISTENTE (sin cambios)
  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setActiveSession(null);
    setFeedbackReport(null); // ✅ NUEVO: Limpiar feedback al volver
    setSidebarVisible(true); // ✅ Restaurar sidebar
    console.log("🔙 Regresando al dashboard");
  }

  // ✅ FUNCIÓN EXISTENTE (sin cambios)
  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  }

  // ✅ NUEVA FUNCIÓN: Manejar evaluación en lugar de completar directamente
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
      setCurrentView("feedback"); // Cambiamos a la vista de feedback
      
    } catch (error) {
      console.error("❌ Error al obtener el feedback:", error);
      alert(`Error al evaluar la simulación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Reintentar simulación desde feedback
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
            <Dashboard onStartSimulation={handleStartSimulation} />
          )}

          {currentView === 'simulation' && activeSession && (
            <SimulationView
              session={activeSession}
              onComplete={handleEvaluation} // ✅ Conectamos la nueva función de evaluación
              onBack={handleBackToDashboard}
              onToggleSidebar={handleToggleSidebar}
              sidebarVisible={sidebarVisible}
              isEvaluating={isEvaluating} // ✅ NUEVO: Pasamos el estado de carga
            />
          )}

          {currentView === 'feedback' && feedbackReport && (
            <FeedbackView
              report={feedbackReport} // ✅ Pasamos el reporte real de evaluación
              onBack={handleBackToDashboard}
              onRetry={handleRetrySimulation} // ✅ Conectamos la función de reintento
            />
          )}
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