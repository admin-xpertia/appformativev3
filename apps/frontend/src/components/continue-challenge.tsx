// En apps/frontend/src/components/continue-challenge.tsx
"use client"

import { Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ISimulationSession } from "../../../../packages/types"

interface ContinueChallengeProps {
  session: ISimulationSession
  onContinue: (session: ISimulationSession) => void
  isContinuing: boolean
}

export function ContinueChallenge({ session, onContinue, isContinuing }: ContinueChallengeProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl"></div>
      <div className="relative card-elevated p-12 rounded-3xl border-2 border-blue-200/50">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">¡Bienvenido de vuelta!</h1>
        <p className="text-xl text-gray-700 mb-8 leading-relaxed">
          Tienes una simulación del caso **"{session.case}"** en progreso. ¿Quieres continuar donde la dejaste?
        </p>
        <Button onClick={() => onContinue(session)} disabled={isContinuing} className="button-primary text-lg px-8 py-4 bg-indigo-600 hover:bg-indigo-700">
          {isContinuing ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <Play className="w-5 h-5 mr-3" />
          )}
          {isContinuing ? "Cargando..." : "Continuar Simulación"}
        </Button>
      </div>
    </div>
  )
}