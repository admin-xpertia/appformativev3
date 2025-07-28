"use client"

import { Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SuggestedChallengeProps {
  case: {
    id: string
    title: string
    currentLevel: string
    attempts: string
    progress: number
    available: boolean
  }
  onStart: () => void
}

const caseDescriptions = {
  sobreconsumo: "Navega una conversación compleja sobre facturación anómala",
  "la-boleta": "Guía a un cliente a través de los conceptos de su factura",
  "termino-medio": "Maneja una situación de término de contrato",
  prorrateo: "Explica los cálculos de prorrateo de manera clara",
  "corte-y-reposicion": "Resuelve un caso de corte y reposición de servicio",
}

export function SuggestedChallenge({ case: caseData, onStart }: SuggestedChallengeProps) {
  const description =
    caseDescriptions[caseData.id as keyof typeof caseDescriptions] ||
    "Un nuevo desafío te espera para continuar tu crecimiento"

  return (
    <div className="relative overflow-hidden">
      {/* Fondo con efecto de respiración */}
      <div className="absolute inset-0 bg-gradient-to-br from-mint/10 to-mint-dark/5 rounded-3xl breathe"></div>

      {/* Contenido principal */}
      <div className="relative card-elevated p-12 rounded-3xl border-2 border-mint-dark/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-mint-dark" />
              <span className="text-mint-dark font-medium text-sm tracking-wide uppercase">Desafío Sugerido</span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">{caseData.title}</h1>

            <p className="text-xl text-gray-700 mb-8 leading-relaxed">{description}</p>

            <div className="flex items-center gap-6 mb-8">
              <div className="text-sm text-gray-600">
                <span className="text-gray-900 font-medium">Nivel actual:</span> {caseData.currentLevel}
              </div>
              <div className="text-sm text-gray-600">
                <span className="text-gray-900 font-medium">Progreso:</span> {caseData.progress}%
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onStart} className="button-primary text-lg px-8 py-4 animate-pulse-mint">
          <Play className="w-5 h-5 mr-3" />
          Comenzar Viaje
        </Button>
      </div>
    </div>
  )
}
