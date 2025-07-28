"use client"

import { ArrowLeft, CheckCircle, AlertTriangle, RotateCcw, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { mockFeedback } from "@/lib/mock-data"

interface FeedbackViewProps {
  onBack: () => void
  onRetry: () => void
}

const competencyNames = {
  "enfoque-cliente": "Enfoque en el Cliente y Empatía",
  regulaciones: "Conocimiento y Aplicación de Regulaciones",
  "resolucion-problemas": "Resolución de Problemas",
  "comunicacion-efectiva": "Comunicación Efectiva",
  integridad: "Integridad",
}

const levelColors = {
  bronce: "bg-[#CD7F32] text-white",
  plata: "bg-[#C0C0C0] text-gray-800",
  oro: "bg-[#FFD700] text-gray-800",
  platino: "bg-[#E5E4E2] text-gray-800",
}

export function FeedbackView({ onBack, onRetry }: FeedbackViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Panel
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">Resultados de la Simulación</h2>
        </div>
        <Badge className="bg-[#2ECC71] text-white text-lg px-4 py-2">¡Simulación Completada!</Badge>
      </div>

      {/* General Feedback */}
      <Card className="border-[#48B5A3] border-2">
        <CardHeader className="bg-[#48B5A3]/10">
          <CardTitle className="text-[#0A2A4D]">Feedback General</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-700 leading-relaxed">{mockFeedback.generalCommentary}</p>
        </CardContent>
      </Card>

      {/* Competency Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback por Competencias</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {mockFeedback.competencyFeedback.map((feedback, index) => (
              <AccordionItem key={feedback.competency} value={`competency-${index}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {competencyNames[feedback.competency as keyof typeof competencyNames]}
                    </span>
                    <Badge className={levelColors[feedback.achievedLevel as keyof typeof levelColors]}>
                      {feedback.achievedLevel.charAt(0).toUpperCase() + feedback.achievedLevel.slice(1)}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#2ECC71] mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Puntos Fuertes
                    </h4>
                    <ul className="space-y-1">
                      {feedback.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Áreas de Mejora
                    </h4>
                    <ul className="space-y-1">
                      {feedback.areasForImprovement.map((area, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Justificación</h4>
                    <p className="text-sm text-gray-700">{feedback.justification}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Tu Plan de Crecimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="recommendations">
              <AccordionTrigger>Ver Tu Plan de Crecimiento</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {mockFeedback.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-[#48B5A3] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{recommendation}</p>
                      <Button variant="link" className="p-0 h-auto text-[#48B5A3] text-sm">
                        Acceder al recurso →
                      </Button>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-6">
        <Button variant="outline" onClick={onBack} className="px-8 bg-transparent">
          Volver al Panel
        </Button>
        <Button onClick={onRetry} className="bg-[#48B5A3] hover:bg-[#48B5A3]/90 px-8">
          <RotateCcw className="w-4 h-4 mr-2" />
          Intentar Nuevamente
        </Button>
        <Button className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 px-8">
          Siguiente Nivel
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
