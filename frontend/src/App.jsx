
import React, { useCallback, useState } from 'react'
import { ElevenLabsProvider, useConversation } from '@elevenlabs/react'
import PoseCoach from './PoseCoach.jsx'
import HeartRatePanel from './HeartRatePanel.jsx'
import Diary from './Diary.jsx'
import Suggestions from './Suggestions.jsx'
import { getWebRTCToken } from './api.js'

function PhoneShell({ children }) {
  return (
    <div className="w-full min-h-screen grid place-items-center p-4">
      <div className="phone-frame bg-white">
        <div className="phone-notch"></div>
        <div className="h-full overflow-auto p-4 pb-24 bg-white">{children}</div>
      </div>
    </div>
  )
}

function CoachView() {
  const convo = useConversation()
  const [connected, setConnected] = useState(false)
  const [tab, setTab] = useState('coach')

  const connect = useCallback(async () => {
    const token = await getWebRTCToken()
    await convo.startConversation({
      conversationToken: token,
      connectionType: 'webrtc',
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onError: (e) => console.error('ElevenLabs error', e),
    })
  }, [convo])

  const disconnect = useCallback(async () => {
    await convo.endConversation?.()
    setConnected(false)
  }, [convo])

  const speak = useCallback((text) => {
    convo.sendUserMessage?.(text)
  }, [convo])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold">AI Sports Coach</div>
        <div className="flex gap-2">
          {!connected ? (
            <button onClick={connect} className="px-3 py-2 rounded bg-green-600 text-white">Connect Coach</button>
          ) : (
            <button onClick={disconnect} className="px-3 py-2 rounded bg-red-600 text-white">Disconnect</button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('coach')} className={`tab ${tab==='coach'?'tab-active':''}`}>Pose Coach</button>
        <button onClick={() => setTab('diary')} className={`tab ${tab==='diary'?'tab-active':''}`}>Diary</button>
        <button onClick={() => setTab('suggest')} className={`tab ${tab==='suggest'?'tab-active':''}`}>Plan</button>
      </div>

      {tab === 'coach' && (
        <div className="space-y-3">
          <PoseCoach speak={speak} />
          <HeartRatePanel onHr={(val) => {
            if (convo?.sendUserMessage) convo.sendUserMessage(`Heart rate update: ${val} bpm`)
          }} />
          <div className="text-sm opacity-70">Status: {connected ? 'Connected to ElevenLabs Agent' : 'Disconnected'}</div>
        </div>
      )}

      {tab === 'diary' && <Diary />}
      {tab === 'suggest' && <Suggestions />}
    </div>
  )
}

export default function App() {
  return (
    <ElevenLabsProvider>
      <PhoneShell>
        <CoachView />
      </PhoneShell>
    </ElevenLabsProvider>
  )
}
