"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { SimulationView } from "@/components/simulation-view-fullscreen" // ✅ Importamos el componente actualizado
import { CaseBriefingModal } from "@/components/case-briefing-modal"
import { getBriefing, startSession } from "@/services/api.service" // ✅ Importamos startSession
import type { ICase, ISimulationSession } from "../../../../packages/types" // ✅ Importamos ISimulationSession

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
  
  // ✅ NUEVO ESTADO: Sesión activa de simulación
  const [activeSession, setActiveSession] = useState<ISimulationSession | null>(null)
  const [isStartingSession, setIsStartingSession] = useState(false)
  
  // ✅ ESTADO PARA EL SIDEBAR EN SIMULACIÓN
  const [sidebarVisible, setSidebarVisible] = useState(true)

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

  // ✅ FUNCIÓN MEJORADA: Crear sesión en BD y cambiar a simulación
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

  // ✅ NUEVA FUNCIÓN: Volver al dashboard desde la simulación
  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setActiveSession(null);
    setSidebarVisible(true); // ✅ Restaurar sidebar
    console.log("🔙 Regresando al dashboard");
  }

  // ✅ NUEVA FUNCIÓN: Toggle del sidebar en simulación
  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  }

  // ✅ NUEVA FUNCIÓN: Completar simulación
  const handleCompleteSimulation = () => {
    console.log("🎯 Simulación completada");
    // TODO: Aquí se podría guardar el feedback final
    handleBackToDashboard();
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
        </main>
      </div>

      {/* ✅ VISTA DE SIMULACIÓN ACTUALIZADA: Usa el componente SimulationView real */}
      {currentView === 'simulation' && activeSession && (
        <SimulationView
          session={activeSession}
          onComplete={handleCompleteSimulation}
          onBack={handleBackToDashboard}
          onToggleSidebar={handleToggleSidebar}
          sidebarVisible={sidebarVisible}
        />
      )}

      <CaseBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        onStart={handleConfirmStart}
        caseData={selectedCase}
        briefingContent={isLoadingBriefing ? "Generando misión..." : briefingText}
        // isStarting={isStartingSession} // ✅ Comentado - CaseBriefingModal no acepta esta prop
      />
    </div>
  )
}