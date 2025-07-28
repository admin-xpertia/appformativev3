"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { SimulationView } from "@/components/simulation-view-fullscreen"
// Faltan las vistas de Feedback y Growth Plan, las crearemos después
// import { FeedbackView } from "@/components/feedback-view"
// import { GrowthPlanView } from "@/components/growth-plan-view"
import { CaseBriefingModal } from "@/components/case-briefing-modal"

// Supondremos un usuario logueado por ahora
const mockUser = {
  id: "user123",
  name: "María González",
  avatar: "/placeholder.svg",
}

export type View = "dashboard" | "simulation" | "feedback" | "history" | "growth-plan"

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("dashboard")

  // ... Aquí irá la lógica para manejar el estado en el futuro ...

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={mockUser} />
      <div className="flex">
        {/* Por ahora, el Sidebar y el Dashboard son estáticos */}
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => setCurrentView(view)} 
          cases={[]} // Lo llenaremos con datos reales pronto
        />
        <main className="flex-1 ml-[280px] mt-16 p-6">
          {currentView === 'dashboard' && <Dashboard />}
          {/* Aquí irán las otras vistas cuando las activemos */}
        </main>
      </div>
    </div>
  )
}