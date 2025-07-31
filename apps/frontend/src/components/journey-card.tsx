"use client"

import { Play, RotateCcw, Trophy, Medal, Award, Crown, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ICase } from "../../../../packages/types"
import { CompetencyLevel } from "../../../../packages/types"

interface JourneyCardProps {
  case: ICase
  onStart: () => void
  onContinue?: () => void // ✅ NUEVA PROP: Para continuar sesión específica
  isHighlighted?: boolean // Para destacar el caso sugerido
}

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

const caseIcons: { [key: string]: string } = {
  sobreconsumo: "⚡",
  "la-boleta": "📄",
  "termino-medio": "⏱️",
  prorrateo: "📊",
  "corte-y-reposicion": "🔄",
}

export function JourneyCard({ 
  case: caseData, 
  onStart, 
  onContinue, // ✅ NUEVA PROP
  isHighlighted = false 
}: JourneyCardProps) {
  const currentLevel = caseData.currentLevel ?? CompetencyLevel.BRONCE
  const progress = caseData.progress ?? 0
  const attempts = caseData.attempts ?? "0 de 3"
  const isAvailable = caseData.available ?? false
  
  // Determinar si el caso está en progreso basándose en el status
  const isInProgress = caseData.status === 'in_progress'
  
  const LevelIcon = levelIcons[currentLevel]
  const caseIcon = caseIcons[caseData.id] || "📋"
  
  // ✅ NUEVA FUNCIÓN: Determinar qué acción ejecutar
  const handleClick = () => {
    if (isInProgress && onContinue) {
      onContinue(); // Continuar sesión existente
    } else {
      onStart(); // Iniciar nueva sesión
    }
  };

  // Determinar texto e ícono del botón
  const buttonText = isInProgress ? "Continuar Viaje" : "Iniciar Viaje"
  const ButtonIcon = isInProgress ? RotateCcw : Play

  return (
    <div className={`
      relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 p-6 group
      ${isInProgress ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}
      ${isHighlighted ? 'ring-2 ring-mint ring-opacity-50' : ''}
    `}>
      
      {/* Indicador de estado en progreso */}
      {isInProgress && (
        <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          En Progreso
        </div>
      )}

      {/* Indicador de caso sugerido */}
      {isHighlighted && !isInProgress && (
        <div className="absolute top-3 right-3 bg-mint text-white text-xs px-2 py-1 rounded-full">
          Sugerido
        </div>
      )}

      {/* Header con icono, título y nivel */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`text-4xl transition-transform duration-300 ${
            isInProgress ? 'animate-pulse' : 'group-hover:scale-110'
          }`}>
            {caseIcon}
          </div>
          <div>
            <h3 className="font-semibold text-xl text-gray-900 mb-1">
              {caseData.title}
            </h3>
            <p className="text-sm text-gray-600">{attempts}</p>
          </div>
        </div>
        
        {/* Badge condicional */}
        {isInProgress ? (
          <Badge className="bg-blue-500 text-white text-xs">
            En Progreso
          </Badge>
        ) : (
          <Badge className={`${levelColors[currentLevel]} text-xs`}>
            <LevelIcon className="w-3 h-3 mr-1" />
            {currentLevel}
          </Badge>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progreso</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isInProgress 
                  ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
                  : 'bg-gradient-to-r from-mint-dark to-mint'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Último intento */}
        {caseData.lastAttempt && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Último: {caseData.lastAttempt}</span>
          </div>
        )}
      </div>

      {/* Botón principal */}
      <Button
        className={`w-full mt-6 transition-all duration-300 ${
          isInProgress 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-100 hover:bg-mint hover:text-white text-gray-900 group-hover:bg-mint-dark group-hover:text-white'
        }`}
        onClick={handleClick} // ✅ USAR FUNCIÓN INTELIGENTE
        disabled={!isAvailable}
      >
        <ButtonIcon className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>
    </div>
  )
}