"use client"

import { Play, X, Clock, Target, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface CaseBriefingModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: () => void
  caseData: {
    id: string
    title: string
    currentLevel: string
    attempts: string
    progress: number
    available: boolean
  } | null
}

const caseDescriptions = {
  sobreconsumo: {
    description:
      "Un cliente reporta un consumo anormalmente alto en su factura mensual. Debes investigar las posibles causas y ofrecer soluciones apropiadas.",
    context:
      "Juan Pérez, cliente residencial desde hace 5 años, recibió una factura por $85.000 cuando normalmente paga $45.000. No ha cambiado sus hábitos de consumo.",
    objectives: [
      "Demostrar empatía con la preocupación del cliente",
      "Investigar las causas del sobreconsumo",
      "Aplicar procedimientos de verificación correctos",
      "Ofrecer soluciones claras y factibles",
      "Mantener comunicación profesional",
    ],
    competencies: ["Enfoque en el Cliente", "Resolución de Problemas", "Comunicación Efectiva"],
    estimatedTime: "15-20 minutos",
  },
  "la-boleta": {
    description: "Cliente con dudas sobre los conceptos incluidos en su factura de servicios públicos.",
    context: "María López necesita entender los diferentes conceptos que aparecen en su factura mensual.",
    objectives: [
      "Explicar claramente cada concepto de la factura",
      "Resolver dudas sobre tarifas y cargos",
      "Proporcionar información educativa",
      "Asegurar comprensión del cliente",
    ],
    competencies: ["Conocimiento de Regulaciones", "Comunicación Efectiva"],
    estimatedTime: "10-15 minutos",
  },
  // Agregar más casos según sea necesario
}

export function CaseBriefingModal({ isOpen, onClose, onStart, caseData }: CaseBriefingModalProps) {
  if (!caseData) return null

  const briefing = caseDescriptions[caseData.id as keyof typeof caseDescriptions] || {
    description: "Caso de simulación para práctica de habilidades de atención al cliente.",
    context: "Situación típica de servicio al cliente que requiere aplicación de competencias clave.",
    objectives: ["Aplicar mejores prácticas de atención", "Resolver la situación del cliente"],
    competencies: ["Comunicación Efectiva"],
    estimatedTime: "15 minutos",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800">Briefing: {caseData.title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Descripción del Caso */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-3 text-[#0A2A4D]">Descripción del Caso</h3>
              <p className="text-gray-700 leading-relaxed">{briefing.description}</p>
            </CardContent>
          </Card>

          {/* Contexto */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-3 text-[#0A2A4D]">Contexto de la Situación</h3>
              <p className="text-gray-700 leading-relaxed">{briefing.context}</p>
            </CardContent>
          </Card>

          {/* Objetivos */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-3 text-[#0A2A4D] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#48B5A3]" />
                Objetivos de la Simulación
              </h3>
              <ul className="space-y-2">
                {briefing.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-[#48B5A3] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Competencias e Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3 text-[#0A2A4D] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#48B5A3]" />
                  Competencias Evaluadas
                </h3>
                <div className="space-y-2">
                  {briefing.competencies.map((competency, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {competency}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3 text-[#0A2A4D] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#48B5A3]" />
                  Información Adicional
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Tiempo estimado:</strong> {briefing.estimatedTime}
                  </p>
                  <p>
                    <strong>Nivel actual:</strong> {caseData.currentLevel}
                  </p>
                  <p>
                    <strong>Intentos:</strong> {caseData.attempts}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="bg-[#48B5A3] hover:bg-[#48B5A3]/90 px-8" onClick={onStart}>
              <Play className="w-4 h-4 mr-2" />
              Comenzar Simulación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
