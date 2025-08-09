import React, { useState, useRef, useEffect } from 'react'

const ChatInterface = ({ connected, speak }) => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: 'Hola! Soy tu entrenador personal de IA. ¿Cómo puedo ayudarte hoy?' }
  ])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText.trim()
    }

    setMessages(prev => [...prev, newUserMessage])
    
    // Send to AI agent if connected
    if (connected && speak) {
      speak(inputText.trim())
    }

    // Simulate AI response (in real app this would come from the AI agent)
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        text: 'Entiendo tu mensaje. Déjame ayudarte con eso...'
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)

    setInputText('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Green Aura Animation */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="green-aura-container">
            <div className="green-aura-pulse"></div>
            <div className="green-aura-wave"></div>
            <div className="green-aura-core"></div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-xs opacity-70">
              {connected ? 'IA Conectada' : 'IA Desconectada'}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                message.type === 'user'
                  ? 'bg-green-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}

export default ChatInterface
