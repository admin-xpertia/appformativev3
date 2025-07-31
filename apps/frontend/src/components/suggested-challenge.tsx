"use client"

import { Play, Sparkles, BookOpen, Award, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ICase } from "../../../../packages/types"

interface SuggestedChallengeProps {
  case: ICase
  onStart: () => void
  // ✅ NUEVAS PROPS para manejar simulaciones en progreso
  onContinue?: () => void  // Función para continuar simulación
  isInProgress?: boolean   // Si tiene sesión activa
  isLoading?: boolean      // Estado de carga
}

// ✅ Diccionario más completo y con mejor manejo de casos faltantes
const caseDescriptions: Record<string, string> = {
  sobreconsumo: "Navega una conversación compleja sobre facturación anómala",
  "la-boleta": "Guía a un cliente a través de los conceptos de su factura",
  "termino-medio": "Maneja una situación de término de contrato",
  prorrateo: "Explica los cálculos de prorrateo de manera clara",
  "corte-y-reposicion": "Resuelve un caso de corte y reposición de servicio",
}

// ✅ Función helper para obtener descripción segura
const getCaseDescription = (caseId: string, caseTitle?: string): string => {
  return caseDescriptions[caseId] || 
         `Desarrolla tus habilidades con el caso "${caseTitle || caseId}"`
}

// ✅ Función helper para formatear nivel
const formatLevel = (level?: string): string => {
  if (!level) return 'Bronce'
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()
}

export function SuggestedChallenge({ 
  case: caseData, 
  onStart, 
  onContinue, 
  isInProgress = false, 
  isLoading = false 
}: SuggestedChallengeProps) {
  // ✅ Manejo seguro de datos
  const description = getCaseDescription(caseData.id, caseData.title)
  const currentLevel = formatLevel(caseData.currentLevel)
  const progress = typeof caseData.progress === 'number' ? caseData.progress : 0
  const attempts = caseData.attempts || '0 de 3'

  // ✅ NUEVA LÓGICA: Determinar qué función ejecutar y qué texto mostrar
  const handleClick = () => {
    if (isInProgress && onContinue) {
      onContinue()
    } else {
      onStart()
    }
  }

  // ✅ NUEVOS VALORES CONDICIONALES
  const headerText = isInProgress ? "Continuar Simulación" : "Desafío Sugerido"
  const buttonText = isInProgress ? "Continuar Simulación" : "Comenzar Viaje"
  const ButtonIcon = isInProgress ? RotateCcw : Play

  return (
    <div className="relative overflow-hidden">
      {/* ✅ Fondo condicional con efecto especial para simulaciones en progreso */}
      <div className={`absolute inset-0 rounded-3xl ${
        isInProgress 
          ? 'bg-gradient-to-br from-mint/20 to-mint-dark/10 breathe animate-pulse' 
          : 'bg-gradient-to-br from-mint/10 to-mint-dark/5 breathe'
      }`}></div>

      {/* ✅ Indicador de estado en progreso */}
      {isInProgress && (
        <div className="absolute top-6 right-6 bg-mint-dark text-white text-xs px-3 py-1 rounded-full font-medium z-10">
          🎯 En progreso
        </div>
      )}

      {/* Contenido principal */}
      <div className={`relative card-elevated p-12 rounded-3xl border-2 ${
        isInProgress ? 'border-mint-dark/40' : 'border-mint-dark/20'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className={`w-6 h-6 text-mint-dark ${
                isInProgress ? 'animate-pulse' : ''
              }`} />
              <span className="text-mint-dark font-medium text-sm tracking-wide uppercase">
                {headerText}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              {caseData.title}
            </h1>

            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              {description}
            </p>

            {/* ✅ Grid mejorado para mostrar información del caso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                isInProgress 
                  ? 'bg-mint/10 border-mint-dark/30' 
                  : 'bg-white/60 border-gray-200/50'
              }`}>
                <Award className="w-5 h-5 text-mint-dark" />
                <div>
                  <p className="text-sm text-gray-600">Nivel actual</p>
                  <p className="text-sm font-medium text-gray-900">{currentLevel}</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                isInProgress 
                  ? 'bg-mint/10 border-mint-dark/30' 
                  : 'bg-white/60 border-gray-200/50'
              }`}>
                <BookOpen className="w-5 h-5 text-mint-dark" />
                <div>
                  <p className="text-sm text-gray-600">Progreso</p>
                  <p className="text-sm font-medium text-gray-900">{progress}%</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                isInProgress 
                  ? 'bg-mint/10 border-mint-dark/30' 
                  : 'bg-white/60 border-gray-200/50'
              }`}>
                <Sparkles className="w-5 h-5 text-mint-dark" />
                <div>
                  <p className="text-sm text-gray-600">Intentos</p>
                  <p className="text-sm font-medium text-gray-900">{attempts}</p>
                </div>
              </div>
            </div>

            {/* ✅ Barra de progreso visual mejorada */}
            {progress > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progreso del caso</span>
                  <span className="text-sm text-gray-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ease-out ${
                      isInProgress
                        ? 'bg-gradient-to-r from-mint to-mint-dark animate-pulse'
                        : 'bg-gradient-to-r from-mint to-mint-dark'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ BOTÓN CONDICIONAL: Cambia según el estado */}
        <Button 
          onClick={handleClick}
          disabled={isLoading}
          className={`text-lg px-8 py-4 transition-all duration-300 ${
            isInProgress
              ? 'button-primary animate-pulse-mint hover:scale-105'
              : 'button-primary hover:scale-105'
          }`}
        >
          {isLoading ? (
            <>
              <RotateCcw className="w-5 h-5 mr-3 animate-spin" />
              Cargando...
            </>
          ) : (
            <>
              <ButtonIcon className="w-5 h-5 mr-3" />
              {buttonText}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}