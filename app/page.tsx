import ChatInterface from './components/ChatInterface'

export default function Home() {
  return (
    <main className="container">
      <h1>Sushibot</h1>
      <p className="instructions">
        Bienvenido! Este es el chatbot de sushiCo. Puedes hacer preguntas sobre productos disponibles, hacer un pedido, cancelarlo o modificarlo. También sobre nuestros horarios y direcciones.
      </p>
      <ChatInterface />
    </main>
  )
}

