'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, Send, User } from 'lucide-react'
import '../../styles/chat.css'

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 0);
  }, [messages])

  const hideKeyboard = () => {
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
  }; const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  async function handleSubmit(e: React.FormEvent | React.KeyboardEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    hideKeyboard();

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')

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
              enterKeyHint="send"
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


