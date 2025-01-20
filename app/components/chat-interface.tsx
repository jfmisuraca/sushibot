"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, Send, User, Sun, Moon } from "lucide-react"
import { useTheme } from "../contexts/ThemeContext"
import "@/styles/chat.css"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { theme, toggleTheme } = useTheme()

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  async function handleSubmit(e: React.FormEvent | React.KeyboardEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, hubo un error al procesar tu mensaje.",
        },
      ])
    } finally {
      setIsLoading(false)
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-card">
        <div className="chat-header">
          <h1 className="chat-title">SushiBot</h1>
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        <div className="chat-content">
          <div className="messages-container">
            <div className="message-list">
              {messages.map((message, index) => (
                <div key={index} className={`message-wrapper ${message.role}`}>
                  <div className="avatar">{message.role === "assistant" ? <Bot size={20} /> : <User size={20} />}</div>
                  <div className={`message ${message.role}`} dangerouslySetInnerHTML={{ __html: message.content }} />
                </div>
              ))}
              {isLoading && (
                <div className="loading">
                  <Bot size={20} className="icon" />
                  <span>Escribiendo...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        <div className="chat-footer">
          <form onSubmit={handleSubmit} className="chat-form">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Escribe tu mensaje aquí..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyUp={handleKeyPress}
                rows={1}
              />
              <button type="submit" className="send-button" disabled={isLoading}>
                <Send />
                <span className="sr-only">Enviar mensaje</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


