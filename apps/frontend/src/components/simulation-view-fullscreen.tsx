"use client"

import React, { useState, useRef, useEffect } from "react"
import { ArrowLeft, Send, Sidebar, X, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { sendTurn, finalizeSession } from "@/services/api.service"
import type { ISimulationSession, IConversationMessage, IFeedbackReport } from "../../../../packages/types"


// ✅ PROPS COMBINADAS: Funcional + Estético + NUEVA PROP
interface SimulationViewProps {
  session: ISimulationSession
  onComplete: () => void
  onBack: () => void
  onToggleSidebar: () => void
  sidebarVisible: boolean
  isEvaluating?: boolean // ✅ NUEVA PROP para estado de evaluación
}

export function SimulationView({ 
  session, 
  onComplete, 
  onBack, 
  onToggleSidebar, 
  sidebarVisible, 
  isEvaluating = false // ✅ NUEVA PROP con valor por defecto
}: SimulationViewProps) {
  // ✅ FUNCIONALIDAD: Estado basado en la sesión real
  const [messages, setMessages] = useState<IConversationMessage[]>(session.conversationHistory)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  
  // 🔥 NUEVOS ESTADOS para control de simulación
  const [simulationComplete, setSimulationComplete] = useState(false)
  const [showEvaluationPrompt, setShowEvaluationPrompt] = useState(false)
  const [canSendMessage, setCanSendMessage] = useState(true)
  const [lastResponse, setLastResponse] = useState<any>(null)
  
  // ✅ ESTÉTICA: Estados para el diseño visual
  const [isInputFocused, setIsInputFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ✅ Auto-scroll cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 🔥 NUEVA FUNCIONALIDAD: Manejar finalización de simulación
  const handleSimulationComplete = (response: any) => {
    console.log("🏁 Simulación completada:", response.message);
    setSimulationComplete(true);
    setCanSendMessage(false);
    setShowEvaluationPrompt(true);
    setLastResponse(response);
    
    // Auto-proceder a evaluación después de 3 segundos
    setTimeout(() => {
      console.log("⏰ Procediendo automáticamente a evaluación...");
      onComplete();
    }, 3000);
  };

  // ✅ FUNCIONALIDAD ACTUALIZADA: Enviar mensaje con manejo de estados
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping || !canSendMessage || simulationComplete || isEvaluating) return

    const userMessage: IConversationMessage = {
      sender: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // ✅ Llamada a la API conectada al grafo de LangGraph
      const response = await sendTurn(session.id, userMessage.content)
      
      // Añadir la respuesta de la IA al chat
      setMessages((prev) => [...prev, response.ai_message])

      // 🔥 MANEJAR LAS NUEVAS RESPUESTAS DEL BACKEND
      switch (response.next_action) {
        case 'continue':
          console.log("⏳ Simulación continúa:", response.message);
          setCanSendMessage(true);
          break;

        case 'evaluation':
          handleSimulationComplete(response);
          break;

        default:
          // Fallback para compatibilidad con respuestas antiguas
          if (response.status === 'completed') {
            handleSimulationComplete(response);
          }
          break;
      }

    } catch (error) {
      console.error("❌ Error al enviar el turno:", error)
      
      // 🔥 CORREGIDO: Type assertion para manejar el error
      const err = error as Error;
      
      const errorMessage: IConversationMessage = {
        sender: 'ai',
        content: 'Hubo un error al procesar tu respuesta. Por favor, intenta de nuevo.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      // Si es un error de recursión, forzar evaluación
      if (err.message.includes('recursión') || err.message.includes('RECURSION_LIMIT')) {
        handleSimulationComplete({
          status: 'completed',
          message: 'La simulación se detuvo por límite técnico.',
          next_action: 'evaluation'
        });
      }
    } finally {
      setIsTyping(false)
    }
  }

  const handleManualFinalize = async () => {
    try {
      setIsTyping(true);
      
      // ✅ CORREGIDO: Usar objeto vacío o propiedades mínimas
      const feedbackReport: IFeedbackReport = {} as IFeedbackReport;
      
      const response = await finalizeSession(session.id, feedbackReport);
      handleSimulationComplete(response);
    } catch (error) {
      console.error("❌ Error al finalizar manualmente:", error);
      
      // 🔥 CORREGIDO: Type assertion para manejar el error
      const err = error as Error;
      
      // Mostrar error al usuario si es necesario
      const errorMessage: IConversationMessage = {
        sender: 'ai',
        content: `Error al finalizar la simulación: ${err.message || 'Error desconocido'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false);
    }
  };
  
  // ✅ ESTÉTICA: Manejo de teclas con Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ✅ ESTÉTICA: Auto-resize del textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue])

  // ✅ FUNCIONALIDAD MEJORADA: Determinar estado de la sesión
  const getSessionStatus = () => {
    if (isEvaluating) {
      return "Evaluando... 🤖"
    }
    if (simulationComplete) {
      return "Completado ✅"
    }
    if (session.endTime) {
      return session.passed ? "Completado ✅" : "Finalizado"
    }
    return "En Progreso"
  }

  const getStatusBadgeColor = () => {
    if (isEvaluating) {
      return "bg-orange-500"
    }
    if (simulationComplete || session.endTime) {
      return "bg-green-500"
    }
    return "bg-[#48B5A3]"
  }

  // 🔥 NUEVA FUNCIÓN: Determinar si mostrar botón de finalización manual
  const shouldShowManualFinalize = () => {
    const userMessages = messages.filter(msg => msg.sender === 'user').length;
    return userMessages >= 2 && !simulationComplete && canSendMessage && !isEvaluating;
  };

  return (
    <div
      className="h-[calc(100vh-64px)] flex flex-col bg-white"
      style={{ 
        marginTop: "64px",
        width: "100%",
        marginLeft: sidebarVisible ? "280px" : "0px",
        transition: "margin-left 0.3s ease",
        position: "relative"
      }}
    >
      {/* ✅ HEADER con estado actualizado - DISEÑO ORIGINAL */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Finalizar
          </Button>
          <Button
            variant="ghost"
            onClick={onToggleSidebar}
            className="hover:bg-gray-100"
            title={sidebarVisible ? "Ocultar panel" : "Mostrar panel"}
          >
            {sidebarVisible ? <X className="w-4 h-4" /> : <Sidebar className="w-4 h-4" />}
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Caso: {session.case} (Nivel {session.level})
            </h2>
            <p className="text-sm text-gray-500">
              Cliente: Juan Pérez | Sesión: {session.id}
            </p>
          </div>
        </div>
        <Badge className={`${getStatusBadgeColor()} text-white`}>
          {getSessionStatus()}
        </Badge>
      </div>

      {/* ✅ MESSAGES AREA - DISEÑO ORIGINAL PRESERVADO */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-3 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-3 rounded-3xl shadow-sm ${
                  message.sender === "user"
                    ? `bg-gradient-to-r ${
                        isInputFocused && index === messages.length - 1
                          ? "from-[#2ECC71] to-[#48B5A3]"
                          : "from-[#48B5A3] to-[#2ECC71]"
                      } text-white`
                    : "bg-white text-gray-800 border border-gray-200"
                }`}
                style={{
                  borderBottomRightRadius: message.sender === "user" ? "8px" : "24px",
                  borderBottomLeftRadius: message.sender === "ai" ? "8px" : "24px",
                }}
              >
                <p className="text-[15px] leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${message.sender === "user" ? "text-white/70" : "text-gray-500"}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {/* ✅ INDICADOR DE TYPING - DISEÑO ORIGINAL */}
          {isTyping && (
            <div className="flex justify-start">
              <div
                className="bg-white px-4 py-3 rounded-3xl shadow-sm border border-gray-200"
                style={{ borderBottomLeftRadius: "8px" }}
              >
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* 🔥 NUEVO: Indicador de evaluación */}
          {isEvaluating && (
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 px-6 py-4 rounded-3xl border border-orange-200 text-center max-w-md">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  <h3 className="font-semibold text-orange-800">Evaluando tu desempeño...</h3>
                </div>
                <p className="text-sm text-orange-700">Analizando tus respuestas con IA pedagógica</p>
              </div>
            </div>
          )}

          {/* 🔥 NUEVO: Prompt de evaluación */}
          {showEvaluationPrompt && !isEvaluating && (
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 px-6 py-4 rounded-3xl border border-green-200 text-center max-w-md">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">¡Simulación Completada!</h3>
                </div>
                <p className="text-sm text-green-700 mb-3">{lastResponse?.message}</p>
                <Button 
                  onClick={onComplete}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isEvaluating}
                >
                  Ver Evaluación
                </Button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ✅ INPUT AREA - DISEÑO ORIGINAL PRESERVADO CON FUNCIONALIDAD NUEVA */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          {/* 🔥 BOTÓN DE FINALIZACIÓN MANUAL */}
          {shouldShowManualFinalize() && (
            <div className="mb-3 text-center">
              <Button
                onClick={handleManualFinalize}
                variant="outline"
                className="text-sm border-orange-200 text-orange-700 hover:bg-orange-50"
                disabled={isTyping || isEvaluating}
              >
                Finalizar Simulación Manualmente
              </Button>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={
                  isEvaluating
                    ? "Evaluando tu desempeño..."
                    : simulationComplete 
                      ? "Simulación completada" 
                      : !canSendMessage 
                        ? "Esperando..." 
                        : "Escribe tu respuesta..."
                }
                className="w-full px-4 py-3 bg-gray-100 rounded-3xl border-none resize-none focus:outline-none focus:ring-2 focus:ring-[#48B5A3]/30 focus:bg-white transition-all duration-200 text-[15px] leading-relaxed"
                style={{ minHeight: "44px", maxHeight: "120px" }}
                disabled={isTyping || simulationComplete || !canSendMessage || isEvaluating}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping || simulationComplete || !canSendMessage || isEvaluating}
              className={`w-11 h-11 rounded-full p-0 transition-all duration-200 ${
                inputValue.trim() && !isTyping && canSendMessage && !simulationComplete && !isEvaluating
                  ? "bg-[#48B5A3] hover:bg-[#2ECC71] shadow-lg scale-100"
                  : "bg-gray-300 cursor-not-allowed scale-95"
              }`}
            >
              <Send className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}