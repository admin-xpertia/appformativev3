"use client"

import { Play, Trophy, Medal, Award, Crown, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface JourneyCardProps {
  case: {
    id: string
    title: string
    currentLevel: string
    attempts: string
    progress: number
    available: boolean
    lastAttempt?: string
  }
  onStart: () => void
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

const caseIcons = {
  sobreconsumo: "⚡",
  "la-boleta": "📄",
  "termino-medio": "⏱️",
  prorrateo: "📊",
  "corte-y-reposicion": "🔄",
}

export function JourneyCard({ case: caseData, onStart }: JourneyCardProps) {
  const LevelIcon = levelIcons[caseData.currentLevel as keyof typeof levelIcons]
  const caseIcon = caseIcons[caseData.id as keyof typeof caseIcons] || "📋"

  return (
    <div className="journey-card group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{caseIcon}</div>
          <div>
            <h3 className="font-semibold text-xl text-gray-900 mb-1">{caseData.title}</h3>
            <p className="text-sm text-gray-600">{caseData.attempts}</p>
          </div>
        </div>
        <Badge className={`${levelColors[caseData.currentLevel as keyof typeof levelColors]} text-xs`}>
          <LevelIcon className="w-3 h-3 mr-1" />
          {caseData.currentLevel}
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progreso</span>
            <span className="font-medium text-gray-900">{caseData.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-mint-dark to-mint h-2 rounded-full transition-all duration-500"
              style={{ width: `${caseData.progress}%` }}
            />
          </div>
        </div>

        {caseData.lastAttempt && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Último: {caseData.lastAttempt}</span>
          </div>
        )}
      </div>

      <Button
        className="w-full mt-6 button-secondary group-hover:bg-mint-dark group-hover:text-white transition-all duration-300"
        onClick={onStart}
        disabled={!caseData.available}
      >
        <Play className="w-4 h-4 mr-2" />
        Iniciar Viaje
      </Button>
    </div>
  )
}
