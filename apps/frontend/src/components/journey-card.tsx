"use client"

import { Play, Trophy, Medal, Award, Crown, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// --- INICIO DE LA CORRECCIÓN 1: Importar tipos centralizados ---
import type { ICase } from "../../../../packages/types"
import { CompetencyLevel } from "../../../../packages/types"
// --- FIN DE LA CORRECCIÓN 1 ---

interface JourneyCardProps {
  // --- INICIO DE LA CORRECCIÓN 2: Usar la interfaz ICase ---
  case: ICase
  // --- FIN DE LA CORRECCIÓN 2 ---
  onStart: () => void
}

// --- INICIO DE LA CORRECCIÓN 3: Hacer los diccionarios más robustos ---
// Mapeamos nuestros Enums a los componentes de íconos y clases de CSS.
const levelIcons: Record<CompetencyLevel, React.ElementType> = {
  [CompetencyLevel.BRONCE]: Medal,
  [CompetencyLevel.PLATA]: Trophy,
  [CompetencyLevel.ORO]: Award,
  [CompetencyLevel.PLATINO]: Crown,
}

const levelColors: Record<CompetencyLevel, string> = {
  [CompetencyLevel.BRONCE]: "bg-gradient-to-r from-amber-600 to-amber-500 text-white",
  [CompetencyLevel.PLATA]: "bg-gradient-to-r from-gray-400 to-gray-300 text-white",
  [CompetencyLevel.ORO]: "bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900",
  [CompetencyLevel.PLATINO]: "bg-gradient-to-r from-gray-300 to-gray-200 text-gray-900",
}
// --- FIN DE LA CORRECCIÓN 3 ---

const caseIcons: { [key: string]: string } = {
  sobreconsumo: "⚡",
  "la-boleta": "📄",
  "termino-medio": "⏱️",
  prorrateo: "📊",
  "corte-y-reposicion": "🔄",
}

export function JourneyCard({ case: caseData, onStart }: JourneyCardProps) {
  // --- INICIO DE LA CORRECCIÓN 4: Manejo seguro de valores opcionales ---
  const currentLevel = caseData.currentLevel ?? CompetencyLevel.BRONCE
  const progress = caseData.progress ?? 0
  const attempts = caseData.attempts ?? "0 de 3"
  const isAvailable = caseData.available ?? false

  const LevelIcon = levelIcons[currentLevel]
  const caseIcon = caseIcons[caseData.id] || "📋"
  // --- FIN DE LA CORRECCIÓN 4 ---

  return (
    <div className="journey-card group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{caseIcon}</div>
          <div>
            <h3 className="font-semibold text-xl text-gray-900 mb-1">{caseData.title}</h3>
            <p className="text-sm text-gray-600">{attempts}</p>
          </div>
        </div>
        <Badge className={`${levelColors[currentLevel]} text-xs`}>
          {LevelIcon && <LevelIcon className="w-3 h-3 mr-1" />}
          {currentLevel}
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progreso</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-mint-dark to-mint h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
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
        disabled={!isAvailable}
      >
        <Play className="w-4 h-4 mr-2" />
        Iniciar Viaje
      </Button>
    </div>
  )
}