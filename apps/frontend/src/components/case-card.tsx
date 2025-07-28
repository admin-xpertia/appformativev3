"use client"

import { Play, Trophy, Medal, Award, Crown, Calendar } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface CaseCardProps {
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
  bronce: "bg-[#CD7F32] text-white",
  plata: "bg-[#C0C0C0] text-gray-800",
  oro: "bg-[#FFD700] text-gray-800",
  platino: "bg-[#E5E4E2] text-gray-800",
}

const caseIcons = {
  sobreconsumo: "⚡",
  "la-boleta": "📄",
  "termino-medio": "⏱️",
  prorrateo: "📊",
  "corte-y-reposicion": "🔄",
}

export function CaseCard({ case: caseData, onStart }: CaseCardProps) {
  const LevelIcon = levelIcons[caseData.currentLevel as keyof typeof levelIcons]
  const caseIcon = caseIcons[caseData.id as keyof typeof caseIcons] || "📋"

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{caseIcon}</div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{caseData.title}</h3>
              <p className="text-sm text-gray-600">{caseData.attempts}</p>
            </div>
          </div>
          <Badge className={levelColors[caseData.currentLevel as keyof typeof levelColors]}>
            <LevelIcon className="w-3 h-3 mr-1" />
            {caseData.currentLevel}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progreso del caso</span>
              <span className="font-medium">{caseData.progress}%</span>
            </div>
            <Progress value={caseData.progress} className="h-2" />
          </div>

          {caseData.lastAttempt && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Último intento: {caseData.lastAttempt}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button className="w-full bg-[#48B5A3] hover:bg-[#48B5A3]/90" onClick={onStart} disabled={!caseData.available}>
          <Play className="w-4 h-4 mr-2" />
          Iniciar Simulación
        </Button>
      </CardFooter>
    </Card>
  )
}
