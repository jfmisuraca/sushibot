'use client'

import { useState } from 'react'
import { Bot, Send, User } from 'lucide-react'
import '../styles/chat.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-card">
      <div className="chat-header">
        <h1 className="chat-title">SushiBot</h1>
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
                <Bot className="icon" />
                <span>Escribiendo...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="chat-footer">
        <form onSubmit={handleSubmit} className="chat-form">
          <textarea
            className="chat-input"
            placeholder="Escribe tu mensaje aquí..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="send-button" disabled={isLoading}>
            <Send className="icon" />
            <span className="sr-only">Enviar mensaje</span>
          </button>
        </form>
      </div>
    </div>
  )
}


