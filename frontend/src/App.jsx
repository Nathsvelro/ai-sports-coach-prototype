
import React, { useCallback, useState } from 'react'
import { useConversation } from '@elevenlabs/react'   // 👈 solo el hook
import Diary from './Diary.jsx'
import Suggestions from './Suggestions.jsx'
import BottomNavbar from './components/BottomNavbar.jsx'
import ChatInterface from './components/ChatInterface.jsx'
import { getWebRTCToken } from './api.js'

function PhoneShell({ children, bottomNavbar }) {
  return (
    <div className="w-full min-h-screen grid place-items-center p-4">
      <div className="phone-frame bg-white">
        <div className="phone-notch"></div>
        <div className="phone-content bg-white">
          {children}
        </div>
        {bottomNavbar}
      </div>
    </div>
  )
}

function CoachView() {
  const convo = useConversation()     // 👈 hook React (web)
  const [connected, setConnected] = useState(false)
  const [tab, setTab] = useState('coach')

  const connect = useCallback(async () => {
    // Pide token WebRTC al backend (mantiene tu API key secreta)
    const token = await getWebRTCToken()
    await convo.startSession({           // 👈 startSession (no startConversation)
      conversationToken: token,
      connectionType: 'webrtc',
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onError: (e) => console.error('ElevenLabs error', e),
    })
  }, [convo])

  const disconnect = useCallback(async () => {
    await convo.endSession?.()          // 👈 endSession (no endConversation)
    setConnected(false)
  }, [convo])

  const speak = useCallback((text) => {
    // Envía un mensaje de usuario al agente para que responda por voz
    convo.sendUserMessage?.(text)
  }, [convo])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">AI Sports Coach</div>
          <div className="flex gap-1">
            {!connected ? (
              <button onClick={connect} className="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">
                Connect
              </button>
            ) : (
              <button onClick={disconnect} className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors">
                Disconnect
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <button onClick={() => setTab('coach')} className={`tab text-xs ${tab==='coach'?'tab-active':''}`}>Coach</button>
          <button onClick={() => setTab('diary')} className={`tab text-xs ${tab==='diary'?'tab-active':''}`}>Diary</button>
          <button onClick={() => setTab('suggest')} className={`tab text-xs ${tab==='suggest'?'tab-active':''}`}>Plan</button>
        </div>
      </div>

      <div className="flex-1 mt-3 overflow-y-auto pb-16">
        {tab === 'coach' && (
          <div className="flex flex-col h-full">
            <ChatInterface connected={connected} speak={speak} />
          </div>
        )}

        {tab === 'diary' && <Diary />}
        {tab === 'suggest' && <Suggestions />}
      </div>
    </div>
  )
}

export default function App() {
  // En React web NO se usa <ElevenLabsProvider> (solo RN lo tiene)
  return (
    <PhoneShell 
      bottomNavbar={
        <CoachViewNavbar />
      }
    >
      <CoachView />
    </PhoneShell>
  )
}

function CoachViewNavbar() {
  const convo = useConversation()
  const [connected, setConnected] = useState(false)
  const [navTab, setNavTab] = useState('chat')

  const connect = useCallback(async () => {
    const token = await getWebRTCToken()
    await convo.startSession({
      conversationToken: token,
      connectionType: 'webrtc',
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onError: (e) => console.error('ElevenLabs error', e),
    })
  }, [convo])

  const speak = useCallback((text) => {
    convo.sendUserMessage?.(text)
  }, [convo])

  const handleChat = useCallback(() => {
    setNavTab('chat')
    console.log('Chat activated')
  }, [])

  const handleMicrophone = useCallback(() => {
    setNavTab('microphone')
    if (connected) {
      console.log('Microphone activated')
    } else {
      connect()
    }
  }, [connected, connect])

  const handleAnalyze = useCallback(() => {
    setNavTab('analyze')
    speak('Por favor, muéstrame tu ejercicio para analizarlo')
  }, [speak])

  return (
    <BottomNavbar
      onChat={handleChat}
      onMicrophone={handleMicrophone}
      onAnalyze={handleAnalyze}
      activeTab={navTab}
    />
  )
}
