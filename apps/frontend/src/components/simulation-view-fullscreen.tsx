"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Send, Sidebar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockConversation, mockCases } from "@/lib/mock-data"

interface SimulationViewProps {
  caseId: string
  onComplete: () => void
  onBack: () => void
  onToggleSidebar: () => void
  sidebarVisible: boolean
}

interface Message {
  sender: "user" | "ai"
  content: string
  timestamp: Date
}

export function SimulationView({ caseId, onComplete, onBack, onToggleSidebar, sidebarVisible }: SimulationViewProps) {
  const [messages, setMessages] = useState<Message[]>(mockConversation)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
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

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue])

  return (
    <div
      className={`h-[calc(100vh-64px)] flex flex-col bg-white transition-all duration-300 ${
        sidebarVisible ? "ml-[280px]" : "ml-0"
      }`}
      style={{ marginTop: "64px" }}
    >
      {/* Header */}
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
            <h2 className="text-lg font-semibold text-gray-800">{currentCase?.title}</h2>
            <p className="text-sm text-gray-500">Cliente: Juan Pérez</p>
          </div>
        </div>
        <Badge className="bg-[#48B5A3] text-white">En Progreso</Badge>
      </div>

      {/* Messages Area */}
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
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - iMessage Style */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Escribe tu respuesta..."
                className="w-full px-4 py-3 bg-gray-100 rounded-3xl border-none resize-none focus:outline-none focus:ring-2 focus:ring-[#48B5A3]/30 focus:bg-white transition-all duration-200 text-[15px] leading-relaxed"
                style={{ minHeight: "44px", maxHeight: "120px" }}
                disabled={isTyping}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className={`w-11 h-11 rounded-full p-0 transition-all duration-200 ${
                inputValue.trim() && !isTyping
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
