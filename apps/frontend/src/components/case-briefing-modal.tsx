"use client"

import { Play, X, Clock, Target, Users, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ICase } from "../../../../packages/types"

interface CaseBriefingModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: () => void
  caseData: ICase | null
  briefingContent: string
  isStarting?: boolean
}

// --- INICIO DE LA CORRECCIÓN ---
// Rellenamos los datos que faltaban para que coincidan con la estructura de tipos.
const caseDetails: { [key: string]: { description: string, context: string, objectives: string[], competencies: string[], estimatedTime: string } } = {
  sobreconsumo: {
    description: "Un cliente reporta un consumo anormalmente alto en su factura mensual. Debes investigar las posibles causas y ofrecer soluciones apropiadas.",
    context: "Juan Pérez, cliente residencial desde hace 5 años, recibió una factura por $85.000 cuando normalmente paga $45.000.",
    objectives: ["Demostrar empatía", "Investigar causas", "Aplicar procedimientos", "Ofrecer soluciones claras"],
    competencies: ["Enfoque en el Cliente", "Resolución de Problemas"],
    estimatedTime: "15-20 minutos",
  },
  "la-boleta": {
    description: "Cliente con dudas sobre los conceptos incluidos en su factura de servicios públicos.",
    context: "María López necesita entender los diferentes conceptos que aparecen en su factura mensual.",
    objectives: ["Explicar cada concepto", "Resolver dudas sobre tarifas", "Proporcionar información educativa"],
    competencies: ["Conocimiento de Regulaciones", "Comunicación Efectiva"],
    estimatedTime: "10-15 minutos",
  },
   // Puedes añadir el resto de los casos aquí
}
// --- FIN DE LA CORRECCIÓN ---

export function CaseBriefingModal({ isOpen, onClose, onStart, caseData, briefingContent, isStarting = false }: CaseBriefingModalProps) {
  if (!caseData) return null

  // --- INICIO DE LA CORRECCIÓN ---
  // Nos aseguramos de que el valor por defecto también cumpla el contrato.
  const details = caseDetails[caseData.id] || {
    description: "Caso de simulación para práctica de habilidades.",
    context: "Situación típica de servicio al cliente que requiere aplicación de competencias clave.",
    objectives: ["Aplicar mejores prácticas de atención", "Resolver la situación del cliente"],
    competencies: ["Comunicación Efectiva"],
    estimatedTime: "15 minutos",
  }
  // --- FIN DE LA CORRECCIÓN ---

  return (
    <Dialog open={isOpen} onOpenChange={!isStarting ? onClose : () => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
           <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800">Briefing: {caseData.title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isStarting}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-3 text-[#0A2A4D]">Descripción de la Misión</h3>
              <p className="text-gray-700 leading-relaxed">{briefingContent}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3 text-[#0A2A4D] flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#48B5A3]" />
                  Objetivos Clave
                </h3>
                <ul className="space-y-2">
                  {details.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-[#48B5A3] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
               <CardContent className="p-6">
                 <h3 className="font-semibold text-lg mb-3 text-[#0A2A4D] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#48B5A3]" />
                  Información
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Tiempo estimado:</strong> {details.estimatedTime}</p>
                  <p><strong>Nivel:</strong> {caseData.currentLevel ?? 'N/A'}</p>
                  <p><strong>Intentos:</strong> {caseData.attempts ?? 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isStarting}>
              Cancelar
            </Button>
            <Button className="bg-[#48B5A3] hover:bg-[#48B5A3]/90 px-8 w-[210px]" onClick={onStart} disabled={isStarting}>
              {isStarting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isStarting ? "Iniciando Sesión..." : "Comenzar Simulación"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}