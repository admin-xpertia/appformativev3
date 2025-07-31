"use client"

import { ArrowLeft, CheckCircle, AlertTriangle, RotateCcw, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { IFeedbackReport } from "../../../../packages/types" // ✅ NUEVO: Import del tipo

// ✅ INTERFACE ACTUALIZADA: Ahora recibe el reporte real
interface FeedbackViewProps {
  report: IFeedbackReport // ✅ NUEVA PROP: Reporte real de evaluación
  onBack: () => void
  onRetry: () => void
}

const competencyNames = {
  "enfoque-cliente": "Enfoque en el Cliente y Empatía",
  "enfoque_cliente_empatia": "Enfoque en el Cliente y Empatía", // ✅ NUEVO: Slug alternativo
  regulaciones: "Conocimiento y Aplicación de Regulaciones",
  "conocimiento_regulaciones": "Conocimiento y Aplicación de Regulaciones", // ✅ NUEVO: Slug alternativo
  "resolucion-problemas": "Resolución de Problemas",
  "resolucion_problemas": "Resolución de Problemas", // ✅ NUEVO: Slug alternativo
  "comunicacion-efectiva": "Comunicación Efectiva",
  "comunicacion_efectiva": "Comunicación Efectiva", // ✅ NUEVO: Slug alternativo
  integridad: "Integridad",
}

const levelColors = {
  bronce: "bg-[#CD7F32] text-white",
  BRONCE: "bg-[#CD7F32] text-white", // ✅ NUEVO: Versión mayúscula
  plata: "bg-[#C0C0C0] text-gray-800",
  PLATA: "bg-[#C0C0C0] text-gray-800", // ✅ NUEVO: Versión mayúscula
  oro: "bg-[#FFD700] text-gray-800",
  ORO: "bg-[#FFD700] text-gray-800", // ✅ NUEVO: Versión mayúscula
  platino: "bg-[#E5E4E2] text-gray-800",
  PLATINO: "bg-[#E5E4E2] text-gray-800", // ✅ NUEVO: Versión mayúscula
}

// ✅ NUEVA FUNCIÓN: Obtener nombre de competencia de forma segura
const getCompetencyName = (competencySlug: string): string => {
  return competencyNames[competencySlug as keyof typeof competencyNames] || competencySlug;
}

// ✅ NUEVA FUNCIÓN: Obtener color de nivel de forma segura
const getLevelColor = (level: string): string => {
  return levelColors[level as keyof typeof levelColors] || "bg-gray-500 text-white";
}

// ✅ NUEVA FUNCIÓN: Formatear nivel para mostrar
const formatLevel = (level: string): string => {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

export function FeedbackView({ report, onBack, onRetry }: FeedbackViewProps) {
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

      {/* General Feedback - ✅ ACTUALIZADO: Usa datos reales */}
      <Card className="border-[#48B5A3] border-2">
        <CardHeader className="bg-[#48B5A3]/10">
          <CardTitle className="text-[#0A2A4D]">Feedback General</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-700 leading-relaxed">{report.generalCommentary}</p>
        </CardContent>
      </Card>

      {/* Competency Feedback - ✅ ACTUALIZADO: Usa datos reales */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback por Competencias</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {report.competencyFeedback.map((feedback, index) => (
              <AccordionItem key={feedback.competency} value={`competency-${index}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {getCompetencyName(feedback.competency)}
                    </span>
                    <Badge className={getLevelColor(feedback.achievedLevel)}>
                      {formatLevel(feedback.achievedLevel)}
                    </Badge>
                    {/* ✅ NUEVO: Indicador de cumplimiento si existe */}
                    {feedback.meetsIndicators !== undefined && (
                      <Badge variant={feedback.meetsIndicators ? "default" : "destructive"}>
                        {feedback.meetsIndicators ? "✓ Cumple" : "✗ No Cumple"}
                      </Badge>
                    )}
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

      {/* Recommendations - ✅ ACTUALIZADO: Usa datos reales */}
      <Card>
        <CardHeader>
          <CardTitle>Tu Plan de Crecimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="recommendations">
              <AccordionTrigger>Ver Tu Plan de Crecimiento</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {report.recommendations.map((recommendation, index) => (
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

      {/* ✅ NUEVA SECCIÓN: Resumen de progreso si existe */}
      {(report as any).passed !== undefined && (
        <Card className={(report as any).passed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className={`text-lg font-semibold mb-2 ${(report as any).passed ? "text-green-800" : "text-orange-800"}`}>
                {(report as any).passed ? "¡Felicitaciones! 🎉" : "Sigue Practicando 📚"}
              </h3>
              <p className={`text-sm ${(report as any).passed ? "text-green-700" : "text-orange-700"}`}>
                {(report as any).passed 
                  ? `Has aprobado el nivel ${(report as any).currentLevel}. ¡Estás listo para el siguiente desafío!`
                  : `Necesitas más práctica en el nivel ${(report as any).currentLevel}. ¡No te desanimes, el progreso requiere tiempo!`
                }
              </p>
              {(report as any).passedCompetencies !== undefined && (
                <p className="text-xs mt-2 opacity-75">
                  Competencias aprobadas: {(report as any).passedCompetencies} de {(report as any).totalCompetencies}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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