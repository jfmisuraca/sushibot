'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, Send, User, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import "@/styles/chat.css"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { theme, toggleTheme } = useTheme()
  const [error, setError] = useState<string | null>(null)


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages])

  // Mantener el foco siempre
  useEffect(() => {
    const keepFocus = () => textareaRef.current?.focus();
    keepFocus();
    window.addEventListener('blur', keepFocus);
    window.addEventListener('focus', keepFocus);
    return () => {
      window.removeEventListener('blur', keepFocus);
      window.removeEventListener('focus', keepFocus);
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  async function handleSubmit(e: React.FormEvent | React.KeyboardEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setError(null)

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await response.json()
      console.log('Respuesta del servidor:', data)

      if (!response.ok) {
        throw new Error(data.error || `Error del servidor: ${response.status} ${response.statusText}`)
      }

      if (!data.response) {
        throw new Error('Respuesta del servidor no válida')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error detallado:', error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error instanceof Error
          ? `Error: ${error.message}`
          : 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-card">
      <div className="chat-header">
        <h1 className="chat-title">SushiBot</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
      <div className="chat-content">
        <div className="messages-container">
          <div className="message-list">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message-wrapper ${message.role}`}
              >
                <div className="avatar">
                  {message.role === 'assistant' ? (
                    <Bot className="icon" />
                  ) : (
                    <User className="icon" />
                  )}
                </div>
                <div className={`message ${message.role}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="loading">
                <Bot size={20} className="icon" />
                <span>Escribiendo...</span>
              </div>
            )}
          </div>
          {error && <div className="error-message">Error: {error}</div>}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="chat-footer">
        <form onSubmit={handleSubmit} className="chat-form">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="Escribe tu mensaje aquí..."
              autoFocus
              onKeyUp={handleKeyPress}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
            />
            <button type="submit" className="send-button" disabled={isLoading}>
              <Send className="icon" />
              <span className="sr-only">Enviar mensaje</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



