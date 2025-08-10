"use client"

import { useCallback, useEffect, useRef, useState } from "react"

function getAPIBase(): string {
  // Must be NEXT_PUBLIC_ to be available on the client in Next.js
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE
  if (fromEnv && fromEnv.length > 0) return fromEnv
  // Fallback to backend server
  return "http://localhost:8000"
}

export function useElevenRTC() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [isRecording, setIsRecording] = useState(false)
  
  const websocketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<AudioBuffer[]>([])

  const connect = useCallback(async () => {
    if (connecting || connected) return
    setError(null)
    setConnecting(true)
    
    try {
      const API_BASE = getAPIBase()
      const wsUrl = API_BASE.replace('http', 'ws') + '/ws/voice'
      
      const ws = new WebSocket(wsUrl)
      websocketRef.current = ws
      
      ws.onopen = () => {
        console.log('WebSocket connected to backend')
        setConnected(true)
        setConnecting(false)
        setError(null)
      }
      
      ws.onmessage = async (event) => {
        try {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data)
            
            if (data.type === 'connected') {
              console.log('Connected to ElevenLabs agent:', data.message)
            } else if (data.type === 'response' || data.type === 'text') {
              console.log('Agent response:', data)
              // Handle text responses from the agent
            } else if (data.type === 'error') {
              console.error('ElevenLabs error:', data.message)
              setError(new Error(data.message))
            }
          } else if (event.data instanceof Blob) {
            // Audio response from ElevenLabs
            await playAudioResponse(event.data)
          }
        } catch (e) {
          console.error('Error processing WebSocket message:', e)
        }
      }
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError(new Error('WebSocket connection failed'))
        setConnecting(false)
        setConnected(false)
      }
      
      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setConnected(false)
        setConnecting(false)
        websocketRef.current = null
      }
      
    } catch (e) {
      console.error('Connection error:', e)
      setError(e)
      setConnecting(false)
      setConnected(false)
      throw e
    }
  }, [connected, connecting])

  const disconnect = useCallback(async () => {
    try {
      // Stop recording if active
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
      }
      
      // Close WebSocket
      if (websocketRef.current) {
        websocketRef.current.close()
        websocketRef.current = null
      }
      
      // Reset state
      setConnected(false)
      setConnecting(false)
      setError(null)
    } catch (e) {
      console.error('Disconnect error:', e)
    }
  }, [isRecording])

  const startRecording = useCallback(async () => {
    if (!connected || isRecording) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          
          // Send audio to backend via WebSocket
          if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(audioBlob)
            console.log('Audio sent to backend, size:', audioBlob.size, 'bytes')
          }
          
        } catch (e) {
          console.error('Error processing audio:', e)
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }
      
      mediaRecorder.start(100) // Send data every 100ms
      setIsRecording(true)
      
    } catch (e) {
      console.error('Error starting recording:', e)
      setError(e)
    }
  }, [connected, isRecording])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }, [isRecording])

  const playAudioResponse = async (audioBlob: Blob) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
      
      // Queue the audio for playback
      audioQueueRef.current.push(audioBuffer)
      
      if (audioQueueRef.current.length === 1) {
        playNextAudio()
      }
    } catch (e) {
      console.error('Error playing audio response:', e)
    }
  }

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) return
    
    const audioBuffer = audioQueueRef.current[0]
    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContextRef.current.destination)
    
    source.onended = () => {
      audioQueueRef.current.shift()
      if (audioQueueRef.current.length > 0) {
        playNextAudio()
      }
    }
    
    source.start(0)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
      if (websocketRef.current) {
        websocketRef.current.close()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [isRecording])

  return { 
    connected, 
    connecting, 
    error, 
    connect, 
    disconnect,
    isRecording,
    startRecording,
    stopRecording
  }
}
