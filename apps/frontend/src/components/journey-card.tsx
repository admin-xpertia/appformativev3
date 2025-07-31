"use client"

import { Play, Trophy, Medal, Award, Crown, Calendar, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ICase } from "../../../../packages/types"
import { CompetencyLevel } from "../../../../packages/types"

interface JourneyCardProps {
  case: ICase
  onStart: () => void
  onContinue: () => void
  isHighlighted?: boolean
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

export function JourneyCard({ case: caseData, onStart, onContinue, isHighlighted = false }: JourneyCardProps) {
  const currentLevel = caseData.currentLevel ?? CompetencyLevel.BRONCE;
  const LevelIcon = levelIcons[currentLevel];
  const caseIcon = caseIcons[caseData.id] || "📋";
  
  const isInProgress = caseData.status === 'in_progress';
  const attemptsText = `${caseData.attempts ?? '0 de 3'}`;
  const isAvailable = caseData.available !== false;

  const handleButtonClick = () => {
    if (isInProgress) {
      onContinue();
    } else {
      onStart();
    }
  };

  return (
    <div className={`relative journey-card group p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ${
      isHighlighted 
        ? 'border-2 border-mint-dark shadow-lg ring-2 ring-mint-light ring-opacity-50' 
        : ''
    } ${
      isInProgress 
        ? 'border-2 border-blue-500 shadow-blue-100' 
        : ''
    }`}>
      
      {isHighlighted && (
        <div className="absolute -top-2 -right-2 bg-mint-dark text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
          Sugerido
        </div>
      )}
      
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{caseIcon}</div>
          <div>
            <h3 className={`font-semibold text-xl mb-1 ${
              isHighlighted ? 'text-mint-dark' : 'text-gray-900'
            }`}>
              {caseData.title}
            </h3>
            <p className="text-sm text-gray-600">{attemptsText}</p>
          </div>
        </div>
        
        {isInProgress ? (
          <Badge className="bg-blue-500 text-white text-xs">En Progreso</Badge>
        ) : (
          <Badge className={`${levelColors[currentLevel]} text-xs`}>
            {LevelIcon && <LevelIcon className="w-3 h-3 mr-1" />}
            {currentLevel}
          </Badge>
        )}
      </div>

      {caseData.progress !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progreso</span>
            <span>{caseData.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-mint-dark h-2 rounded-full transition-all duration-300" 
              style={{ width: `${caseData.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <Button
        className={`w-full mt-6 transition-all duration-300 ${
          isInProgress 
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
            : isHighlighted
              ? 'bg-mint-dark text-white hover:bg-mint-darker'
              : 'bg-gray-100 hover:bg-mint-dark hover:text-white text-gray-700'
        }`}
        onClick={handleButtonClick}
        disabled={!isAvailable}
        type="button"
      >
        {isInProgress ? <RotateCw className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
        {isInProgress ? "Continuar Viaje" : "Iniciar Viaje"}
      </Button>
    </div>
  )
}