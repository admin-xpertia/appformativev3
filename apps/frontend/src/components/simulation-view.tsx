"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Send, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockConversation, mockCases } from "@/lib/mock-data"

interface SimulationViewProps {
  caseId: string
  onComplete: () => void
  onBack: () => void
}

interface Message {
  sender: "user" | "ai"
  content: string
  timestamp: Date
}

export function SimulationView({ caseId, onComplete, onBack }: SimulationViewProps) {
  const [messages, setMessages] = useState<Message[]>(mockConversation)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentCase = mockCases.find((c) => c.id === caseId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      sender: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "Entiendo su preocupación. Permíteme revisar su cuenta para ayudarle mejor.",
        "Gracias por esa información. Veo que efectivamente hay una discrepancia en su factura.",
        "Perfecto, he procesado su solicitud. ¿Hay algo más en lo que pueda ayudarle?",
        "Muchas gracias por su paciencia. Su caso ha sido resuelto satisfactoriamente.",
      ]

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]

      const aiMessage: Message = {
        sender: "ai",
        content: randomResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)

      // After 4 messages, complete simulation
      if (messages.length >= 6) {
        setTimeout(() => {
          onComplete()
        }, 2000)
      }
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">Simulación: {currentCase?.title}</h2>
          </div>
          <Badge className="bg-[#48B5A3] text-white">En Progreso</Badge>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender === "user" ? "bg-[#0A2A4D] text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                  {message.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-[#48B5A3] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
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
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input Area */}
        <div className="mt-4 flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu respuesta al cliente..."
            className="flex-1 min-h-[60px] resize-none"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="bg-[#48B5A3] hover:bg-[#48B5A3]/90 px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-lg">Información del Caso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Objetivos</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Demostrar empatía con el cliente</li>
              <li>• Aplicar procedimientos correctos</li>
              <li>• Resolver el problema eficientemente</li>
              <li>• Mantener comunicación clara</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Competencias Evaluadas</h4>
            <div className="space-y-2">
              <Badge variant="outline">Enfoque en el Cliente</Badge>
              <Badge variant="outline">Resolución de Problemas</Badge>
              <Badge variant="outline">Comunicación Efectiva</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Progreso</h4>
            <div className="text-sm text-gray-600">
              <p>Mensajes intercambiados: {messages.length}</p>
              <p>Tiempo transcurrido: {Math.floor(Math.random() * 10) + 5} min</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
