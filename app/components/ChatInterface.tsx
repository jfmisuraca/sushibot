'use client'

import { useState, useEffect, useRef } from 'react'

export default function ChatInterface() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot', content: string }>>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])

    setInput('')

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    })

    const data = await response.json()
    const botMessage = { role: 'bot' as const, content: String(data.response) }

    setMessages(prev => [...prev, botMessage])
  }

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}>
            {message.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje aquí"
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  )
}

