"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Volume2, VolumeX, Dumbbell, Timer, Play, Phone, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast, Toaster } from "sonner"
import { useConversation } from '@elevenlabs/react'
import { getWebRTCToken } from '@/lib/api'

type Role = "agent" | "user" | "system"
type MessageKind = "text" | "questions" | "plan" | "notice"

type Exercise = {
  name: string
  sets: number
  reps: string
  restBetweenSetsSec: number
  restBetweenRepsSec?: number
  youtube: string
}

type Plan = {
  title: string
  note?: string
  day: string
  exercises: Exercise[]
}

type ChatMessage = {
  id: string
  role: Role
  kind: MessageKind
  content: string | Plan
}

type Stage = "init" | "awaitingPermission" | "connectedAnalyzing" | "awaitingAnswers" | "planDelivered"

/**
 * Animated green aura (visual only)
 */
function AuraVoice({
  speaking = false,
  color = "#22c55e",
}: {
  speaking?: boolean
  color?: string
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center pt-4 pb-2">
      <div className="relative h-36 w-36">
        <div
          className={cn("absolute inset-0 rounded-full", speaking ? "animate-ping" : "animate-pulse")}
          style={{
            backgroundColor: color,
            opacity: speaking ? 0.25 : 0.15,
            filter: "blur(6px)",
          }}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full shadow-2xl transition-transform duration-300",
            speaking ? "scale-105" : "scale-100",
          )}
          style={{
            background: `radial-gradient(60% 60% at 50% 50%, ${color} 0%, rgba(34, 197, 94, 0.65) 45%, rgba(34, 197, 94, 0.15) 100%)`,
            boxShadow: `0 0 40px 12px ${color}33`,
          }}
        />
        <div
          className={cn("absolute inset-0 rounded-full mix-blend-overlay", speaking ? "animate-pulse" : "")}
          style={{
            background: "radial-gradient(30% 30% at 30% 30%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)",
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

/**
 * Simple chat bubble
 */
function ChatBubble({
  role = "agent",
  children,
}: {
  role?: Role
  children: React.ReactNode
}) {
  const isUser = role === "user"
  const isSystem = role === "system"
  return (
    <div className={cn("w-full flex mb-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isSystem
            ? "bg-amber-50 text-amber-900 border border-amber-200"
            : isUser
              ? "bg-gray-900 text-white"
              : "bg-white border border-gray-200 text-gray-900",
        )}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * 15s camera check dialog (simulated)
 */
function ExerciseCheckDialog({
  open = false,
  onOpenChange = () => { },
  exerciseName = "Ejercicio",
  onResult = () => { },
}: {
  open?: boolean
  onOpenChange?: (next: boolean) => void
  exerciseName?: string
  onResult?: (ok: boolean, feedback?: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [countdown, setCountdown] = useState<number>(15)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let interval: number | undefined

    async function start() {
      try {
        setCountdown(15)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        interval = window.setInterval(() => {
          setCountdown((c) => {
            const next = c - 1
            if (next <= 0) {
              window.clearInterval(interval)
              const ok = Math.random() > 0.4
              const feedback = ok
                ? "¡Excelente ejecución! Mantén esa técnica."
                : "Detecté curvatura en la espalda. Mantén el core firme y baja el peso para priorizar la forma."
              onResult(ok, feedback)
              stop()
              onOpenChange(false)
            }
            return next > 0 ? next : 0
          })
          return
        }, 1000)
      } catch (e) {
        console.error("Camera error:", e)
      }
    }

    function stop() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      }
      if (interval) window.clearInterval(interval)
    }

    if (open) start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-base">Revisión en tiempo real (15s)</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4">
          <div className="text-sm text-gray-600 mb-2">{`Mostrando cámara frontal para evaluar: ${exerciseName}`}</div>
          <div className="w-full aspect-[9/16] bg-black rounded-xl overflow-hidden mb-3">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <Timer className="h-4 w-4" />
              <span className="text-sm">Restante: {countdown}s</span>
            </div>
            <div className="text-xs text-gray-500">{"Analizando postura…"}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Fixed bottom talk bar with:
 * - Text input (default for user)
 * - Green send icon
 * - Green microphone button ("Talk to Agent")
 * - Glowing aura behind the bar
 */
function BottomTalkBar({
  value,
  onChange,
  onSend,
  onMic,
  micActive,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onMic: () => void
  micActive: boolean
}) {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Glowing aura layer behind the bar */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[94%] h-28 pointer-events-none" aria-hidden="true">
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-2xl transition-opacity",
            "bg-emerald-500/40",
            micActive ? "opacity-100 animate-pulse" : "opacity-70",
          )}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-3xl mix-blend-screen",
            "bg-[radial-gradient(60%_60%_at_50%_50%,rgba(16,185,129,0.9),rgba(16,185,129,0.4)_45%,transparent_90%)]",
          )}
        />
      </div>

      {/* Bar container */}
      <div
        className={cn(
          "relative mx-3 mb-[max(10px,env(safe-area-inset-bottom))]",
          "rounded-2xl border border-emerald-200/70 bg-white/85 backdrop-blur",
          "shadow-[0_8px_30px_rgba(16,185,129,0.25)]",
        )}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Bigger text input */}
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Escribe tu mensaje"
              className="text-base h-14 px-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSend()
              }}
              aria-label="Escribe tu mensaje para el agente"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Enviar mensaje"
              onClick={onSend}
              disabled={!value.trim()}
              className="rounded-xl h-14 w-14"
            >
              <Send className={cn("h-6 w-6", value.trim() ? "text-emerald-600" : "text-gray-300")} />
            </Button>
          </div>

          {/* Call button: icon only, changes color based on connection status */}
          <Button
            onClick={onMic}
            size="icon"
            className={cn(
              "h-14 w-14 rounded-xl text-white transition-colors duration-200",
              micActive
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            )}
            aria-pressed={micActive}
            aria-label="Talk to Agent"
            title="Talk to Agent"
          >
            <Phone className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>

  )
}

export default function Page() {
  const [stage, setStage] = useState<Stage>("init")
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // ElevenLabs WebRTC state
  const convo = useConversation()
  const [connected, setConnected] = useState(false)
  const [muted, setMuted] = useState<boolean>(false)
  const [speaking, setSpeaking] = useState<boolean>(false)
  const [subtitle, setSubtitle] = useState<string>("") // shown in chat as live bubble

  // Input state (default visible input)
  const [input, setInput] = useState("")

  // Exercise check
  const [checkOpen, setCheckOpen] = useState<boolean>(false)
  const [checkingExercise, setCheckingExercise] = useState<string>("")

  const listRef = useRef<HTMLDivElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // ElevenLabs WebRTC connection functions
  const connect = useCallback(async () => {
    try {
      const token = await getWebRTCToken()
      await convo.startSession({
        conversationToken: token,
        connectionType: 'webrtc',
        onConnect: () => {
          setConnected(true)
          toast.success("Connected to ElevenLabs voice agent")
        },
        onDisconnect: () => {
          setConnected(false)
          toast.info("Disconnected from voice agent")
        },
        onError: (e) => {
          console.error('ElevenLabs error', e)
          toast.error("Voice connection error")
        },
      })
    } catch (error) {
      console.error('Failed to connect:', error)
      toast.error("Failed to connect to voice agent")
    }
  }, [convo])

  const disconnect = useCallback(async () => {
    try {
      await convo.endSession?.()
      setConnected(false)
      toast.info("Voice connection ended")
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }, [convo])

  const speak = useCallback((text: string) => {
    if (connected) {
      // Send message to ElevenLabs agent
      convo.sendUserMessage?.(text)
    } else {
      // Fallback to TTS
      setSubtitle("")
      if (muted || typeof window === "undefined" || !("speechSynthesis" in window)) {
        setSpeaking(false)
        let i = 0
        const step = 24
        const timer = window.setInterval(() => {
          i += 1
          setSubtitle(text.slice(0, i * step))
          if (i * step >= text.length) {
            window.clearInterval(timer)
            setTimeout(() => setSubtitle(""), 1200)
          }
        }, 60)
        return
      }

      try {
        const utter = new SpeechSynthesisUtterance(text)
        utter.lang = "es-MX"
        utter.rate = 0.98
        utter.pitch = 1.0
        const voices = window.speechSynthesis.getVoices()
        const esVoice = voices.find((v) => v.lang.toLowerCase().startsWith("es")) ?? voices[0]
        if (esVoice) utter.voice = esVoice

        let i = 0
        const chunk = 2
        const typeTimer = window.setInterval(() => {
          i += chunk
          setSubtitle(text.slice(0, i))
          if (i >= text.length) window.clearInterval(typeTimer)
        }, 35)

        utter.onstart = () => setSpeaking(true)
        utter.onend = () => {
          setSpeaking(false)
          setTimeout(() => setSubtitle(""), 1200)
        }

        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utter)
      } catch (e) {
        console.error("TTS error:", e)
        setSpeaking(false)
        setSubtitle("")
      }
    }
  }, [connected, convo, muted])

  // Auto scroll to bottom on changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, subtitle])

  // Flow helpers
  const connectWearable = useCallback(async () => {
    setStage("awaitingPermission")
    await new Promise((r) => setTimeout(r, 900))
    setStage("connectedAnalyzing")
    setMessages((prev) => [
      ...prev,
      {
        id: "sys-2",
        role: "system",
        kind: "notice",
        content: "Conectado a tu wearable. Analizando tus métricas…",
      },
    ])

    await new Promise((r) => setTimeout(r, 1400))
    const greet =
      "Hola, soy tu coach de gimnasio. Ya revisé tus métricas de hoy. Para personalizar tu plan, respóndeme esta información."
    speak(greet)

    const q =
      "1) ¿Cuál es tu objetivo principal estas 8 semanas? 2) ¿Cuántos días a la semana puedes entrenar? 3) ¿Tienes alguna lesión o molestia actual? 4) ¿Cuál es tu nivel de experiencia (principiante, intermedio, avanzado)?"
    setMessages((prev) => [
      ...prev,
      {
        id: "q-1",
        role: "agent",
        kind: "questions",
        content: q,
      },
    ])
    setStage("awaitingAnswers")
  }, [speak])

  const generatePlan = useCallback((answer: string): Plan => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
    const day = days[new Date().getDay() % days.length]
    return {
      title: "Rutina personalizada",
      note: "Enfocada en técnica y progresión. Ajusta el peso para completar la última repetición con buena forma.",
      day,
      exercises: [
        {
          name: "Sentadilla Goblet",
          sets: 4,
          reps: "8-10",
          restBetweenSetsSec: 90,
          restBetweenRepsSec: 0,
          youtube: "https://www.youtube.com/watch?v=6xwZ5H5Hh6Y",
        },
        {
          name: "Press de Banca con Mancuernas",
          sets: 3,
          reps: "10-12",
          restBetweenSetsSec: 90,
          restBetweenRepsSec: 0,
          youtube: "https://www.youtube.com/watch?v=VmB1G1K7v94",
        },
        {
          name: "Remo con Mancuerna a una Mano",
          sets: 3,
          reps: "10-12 por lado",
          restBetweenSetsSec: 75,
          restBetweenRepsSec: 0,
          youtube: "https://www.youtube.com/watch?v=pYcpY20QaE8",
        },
        {
          name: "Plancha",
          sets: 3,
          reps: "30-45s",
          restBetweenSetsSec: 60,
          restBetweenRepsSec: 0,
          youtube: "https://www.youtube.com/watch?v=ASdvN_XEl_c",
        },
      ],
    }
  }, [])

  const sendTextMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", kind: "text", content: trimmed }])
      setInput("")
      if (stage === "awaitingAnswers") {
        const plan = generatePlan(trimmed)
        speak("Perfecto. Con base en tu información, aquí tienes tu rutina de hoy.")
        setTimeout(() => {
          setMessages((prev) => [...prev, { id: `plan-${Date.now()}`, role: "agent", kind: "plan", content: plan }])
          setStage("planDelivered")
        }, 700)
      }
    },
    [generatePlan, speak, stage],
  )

  const onCheckExercise = useCallback((name: string) => {
    setCheckingExercise(name)
    setCheckOpen(true)
  }, [])

  const onCheckResult = useCallback(
    (ok: boolean, feedback?: string) => {
      const msg = ok
        ? `Tu ${checkingExercise} se ve correcto. ${feedback ?? ""}`
        : `Hay ajustes para tu ${checkingExercise}. ${feedback ?? ""}`
      setMessages((prev) => [...prev, { id: `check-${Date.now()}`, role: "system", kind: "notice", content: msg }])
    },
    [checkingExercise],
  )

  const QuestionsBlock = useMemo(() => {
    const qMsg = messages.findLast((m) => m.kind === "questions")
    if (!qMsg) return null
    return (
      <Card className="border-emerald-200">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-emerald-500" />
            {"Preguntas para personalizar tu plan"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="list-decimal list-inside space-y-2 text-sm text-gray-800">
            {String(qMsg.content)
              .split(/\d\)/)
              .map((l) => l.trim())
              .filter(Boolean)
              .map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
          </ul>
          <div className="mt-3 text-xs text-gray-500">{"Responde abajo en el campo de mensaje."}</div>
        </CardContent>
      </Card>
    )
  }, [messages])

  // Initial smooth scroll
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [])

  // Auto-scroll to bottom when new messages arrive (like WhatsApp)
  useEffect(() => {
    if (listRef.current) {
      const scrollToBottom = () => {
        const el = listRef.current!
        // Smooth scroll to bottom to show latest message above BottomTalkBar
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        })
      }

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(scrollToBottom)
    }
  }, [messages])

  const handleMic = async () => {
    if (connected) {
      await disconnect()
    } else {
      await connect()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center p-4">
      {/* iPhone-like device frame */}
      <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
        {/* iPhone notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-20"></div>

        {/* iPhone screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
          {/* Status bar */}
          <div className="h-11 bg-black text-white flex items-center justify-between px-8 text-sm font-medium relative z-10">
            <div className="flex items-center gap-1">
              <div className="w-6 h-3 bg-white rounded-full"></div>
              <span>9:41</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-white rounded-sm"></div>
              <div className="w-6 h-2 bg-white rounded-sm"></div>
              <div className="w-8 h-2 bg-white rounded-sm"></div>
            </div>
          </div>

          {/* Main app content */}
          <main className="relative h-[calc(100%-44px)] bg-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
              <div className="mx-auto max-w-sm px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "#22c55e" }} aria-hidden="true" />
                  <div className="text-sm font-semibold">{"Coach de Gym"}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Activar voz del coach" : "Silenciar voz del coach"}
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            </header>

            {/* Scrollable chat list with integrated AuraVoice */}
            <div
              ref={listRef}
              className={cn("flex-1 overflow-y-auto scroll-smooth relative scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent")}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div
                className="fixed inset-x-0 z-[60] pointer-events-none"
                style={{ top: "calc(env(safe-area-inset-top) + 140px)" }}
                aria-hidden="true"
              >
                <div className="relative mx-auto flex items-center justify-center" style={{ width: "9rem", height: "9rem" }}>
                  {/* Radial fade that starts hiding content when it reaches the aura level */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
                    style={{
                      width: "16rem",
                      height: "16rem",
                      background:
                        "radial-gradient(closest-side, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0) 85%)",
                    }}
                  />
                  {/* Aura on top of the fade */}
                  <div className="relative z-10">
                    <AuraVoice speaking={speaking} color="#22c55e" />
                  </div>
                </div>
              </div>

              {/* Chat messages with top fade to blend with AuraVoice */}
              <div className="mx-auto max-w-sm px-4 space-y-3 pb-48">
                {/* Top fade overlay to make chat text disappear as it approaches AuraVoice */}
                <div className="relative h-16 pointer-events-none z-20" aria-hidden="true">
                  <div className="mx-auto max-w-sm h-full w-full bg-gradient-to-b from-white via-white/90 to-transparent" />
                </div>


                {stage === "awaitingPermission" && <ChatBubble role="system">{"Solicitando permiso…"}</ChatBubble>}

                {stage === "connectedAnalyzing" && (
                  <ChatBubble role="system">{"Conectado. Analizando métricas de hoy…"}</ChatBubble>
                )}

                {messages.map((m) => {
                  if (m.kind === "plan") {
                    const plan = m.content as Plan
                    return (
                      <div key={m.id} className="mb-4">
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Dumbbell className="h-5 w-5 text-emerald-600" />
                              {plan.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100" variant="secondary">
                                {plan.day}
                              </Badge>
                              {plan.note && <span className="text-xs text-gray-500">{plan.note}</span>}
                            </div>
                            <div className="space-y-3">
                              {plan.exercises.map((ex, idx) => (
                                <div key={`${ex.name}-${idx}`} className="rounded-xl border border-gray-200 p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium">{ex.name}</div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-emerald-300 text-emerald-700 bg-transparent"
                                      onClick={() => {
                                        setCheckingExercise(ex.name)
                                        setCheckOpen(true)
                                      }}
                                    >
                                      <Play className="h-3.5 w-3.5 mr-1" />
                                      {"Revisión 15s"}
                                    </Button>
                                  </div>
                                  <div className="mt-1 text-sm text-gray-700">{`Series: ${ex.sets} • Reps: ${ex.reps}`}</div>
                                  <div className="text-xs text-gray-500">
                                    {`Descanso: ${ex.restBetweenSetsSec}s entre series`}
                                    {ex.restBetweenRepsSec ? ` • ${ex.restBetweenRepsSec}s entre reps` : ""}
                                  </div>
                                  <a
                                    href={ex.youtube}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-block text-xs text-emerald-700 underline"
                                  >
                                    {"Ver técnica en YouTube"}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  }

                  if (m.kind === "questions") {
                    return (
                      <div key={m.id} className="mb-3">
                        <ChatBubble role="agent">{QuestionsBlock}</ChatBubble>
                      </div>
                    )
                  }

                  return (
                    <div key={m.id}>
                      <ChatBubble role={m.role}>
                        <div className="whitespace-pre-line">{String(m.content)}</div>
                      </ChatBubble>
                    </div>
                  )
                })}

                {/* Live subtitles bubble in chat */}
                {subtitle && (
                  <ChatBubble role="agent">
                    <div className="text-gray-800">{subtitle}</div>
                  </ChatBubble>
                )}

                {/* Spacer to ensure last message is visible above BottomTalkBar */}
                <div className="h-2" />

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Bottom fade overlay (covers the full talk bar height) */}
            <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none z-40" aria-hidden="true">
              <div className="mx-auto max-w-sm h-full w-full bg-gradient-to-b from-transparent via-white/70 to-white" />
            </div>

            {/* Bottom talk bar positioned inside iPhone frame */}
            <div className="absolute inset-x-0 bottom-0 z-50">
              <BottomTalkBar
                value={input}
                onChange={setInput}
                onSend={() => sendTextMessage(input)}
                onMic={handleMic}
                micActive={connected}
              />
            </div>

            {/* 15s check dialog */}
            <ExerciseCheckDialog
              open={checkOpen}
              onOpenChange={setCheckOpen}
              exerciseName={checkingExercise}
              onResult={onCheckResult}
            />

            {/* Toast notifications */}
            <Toaster />
          </main>
        </div>
      </div>
    </div>
  )
}
