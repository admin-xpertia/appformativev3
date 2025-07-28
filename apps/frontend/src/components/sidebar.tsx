"use client"

import { LayoutDashboard, History, Trophy, Medal, Award, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { View } from "@/app/page"

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
  cases: Array<{
    id: string
    title: string
    currentLevel: string
    attempts: string
    progress: number
    available: boolean
  }>
}

const levelIcons = {
  bronce: Medal,
  plata: Trophy,
  oro: Award,
  platino: Crown,
}

const levelColors = {
  bronce: "bg-gradient-to-r from-amber-600 to-amber-500 text-white",
  plata: "bg-gradient-to-r from-gray-400 to-gray-300 text-white",
  oro: "bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900",
  platino: "bg-gradient-to-r from-gray-300 to-gray-200 text-gray-900",
}

export function Sidebar({ currentView, onViewChange, cases }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-16 w-[280px] h-[calc(100vh-64px)] frosted-glass overflow-y-auto">
      <div className="p-6">
        <nav className="space-y-2 mb-8">
          <Button
            variant={currentView === "dashboard" ? "default" : "ghost"}
            className={`w-full justify-start transition-all duration-200 ${
              currentView === "dashboard"
                ? "bg-mint-dark text-white hover:bg-mint-dark/90 shadow-lg"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            }`}
            onClick={() => onViewChange("dashboard")}
          >
            <LayoutDashboard className="mr-3 h-4 w-4" />
            Mi Santuario
          </Button>

          <Button
            variant={currentView === "history" ? "default" : "ghost"}
            className={`w-full justify-start transition-all duration-200 ${
              currentView === "history"
                ? "bg-mint-dark text-white hover:bg-mint-dark/90 shadow-lg"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            }`}
            onClick={() => onViewChange("history")}
          >
            <History className="mr-3 h-4 w-4" />
            Historial
          </Button>

          <Button
            variant={currentView === "growth-plan" ? "default" : "ghost"}
            className={`w-full justify-start transition-all duration-200 ${
              currentView === "growth-plan"
                ? "bg-mint-dark text-white hover:bg-mint-dark/90 shadow-lg"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            }`}
            onClick={() => onViewChange("growth-plan")}
          >
            <Trophy className="mr-3 h-4 w-4" />
            Plan de Crecimiento
          </Button>
        </nav>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4 text-sm tracking-wide uppercase opacity-70">
            Viajes Disponibles
          </h3>
          <div className="space-y-3">
            {cases.map((case_) => {
              const LevelIcon = levelIcons[case_.currentLevel as keyof typeof levelIcons]
              return (
                <div
                  key={case_.id}
                  className="p-4 rounded-xl bg-white/60 border border-gray-200 hover:border-mint-dark/30 transition-all duration-300 hover:bg-white/80"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900 text-sm">{case_.title}</span>
                    <Badge className={`${levelColors[case_.currentLevel as keyof typeof levelColors]} text-xs`}>
                      <LevelIcon className="w-3 h-3 mr-1" />
                      {case_.currentLevel}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">{case_.attempts}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
