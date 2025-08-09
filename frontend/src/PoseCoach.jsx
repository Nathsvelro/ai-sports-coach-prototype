
import React, { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

function angleDeg(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const dot = (ab.x * cb.x + ab.y * cb.y)
  const magAB = Math.hypot(ab.x, ab.y)
  const magCB = Math.hypot(cb.x, cb.y)
  const cos = dot / (magAB * magCB + 1e-9)
  return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI
}

export default function PoseCoach({ speak }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [feedbackCooldown, setFeedbackCooldown] = useState(0)

  useEffect(() => {
    let running = true
    let landmarker
    let rafId

    async function init() {
      const resolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm'
      )
      landmarker = await PoseLandmarker.createFromOptions(resolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
        },
        numPoses: 1,
        runningMode: 'VIDEO'
      })
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setReady(true)

      const ctx = canvasRef.current.getContext('2d')

      async function frame() {
        if (!running) return
        const v = videoRef.current
        canvasRef.current.width = v.videoWidth
        canvasRef.current.height = v.videoHeight
        const res = await landmarker.detectForVideo(v, performance.now())
        ctx.clearRect(0,0,canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(v, 0, 0, canvasRef.current.width, canvasRef.current.height)

        if (res.landmarks && res.landmarks[0]) {
          const lm = res.landmarks[0]
          const LSH = lm[11], RSH = lm[12], LHP = lm[23], RHP = lm[24], LKN = lm[25], RKN = lm[26], LAN = lm[27], RAN = lm[28]
          const backLeft = LHP && LSH ? angleDeg(LSH, LHP, { x: LHP.x, y: LHP.y - 1 }) : 180
          const backRight = RHP && RSH ? angleDeg(RSH, RHP, { x: RHP.x, y: RHP.y - 1 }) : 180
          const backAngle = (backLeft + backRight) / 2
          const kneeAngleL = (LSH && LKN && LAN) ? angleDeg(LSH, LKN, LAN) : 180
          const kneeAngleR = (RSH && RKN && RAN) ? angleDeg(RSH, RKN, RAN) : 180

          ctx.fillStyle = 'rgba(0,0,0,0.8)'
          ;[LSH,RSH,LHP,RHP,LKN,RKN,LAN,RAN].forEach(p => {
            if (p) { ctx.beginPath(); ctx.arc(p.x*canvasRef.current.width, p.y*canvasRef.current.height, 4, 0, 2*Math.PI); ctx.fill() }
          })

          const isTooRounded = backAngle < 165
          const notDeep = Math.min(kneeAngleL, kneeAngleR) > 90

          if (feedbackCooldown <= 0) {
            if (isTooRounded) {
              speak?.("Coaching tip: keep your back straighter as you descend.")
              setFeedbackCooldown(90)
            } else if (notDeep) {
              speak?.("Try to go a bit deeper—aim for thighs parallel to the floor.")
              setFeedbackCooldown(90)
            } else {
              // occasional positive reinforcement
              if (Math.random() < 0.01) {
                speak?.("Nice form—keep breathing and stay tall through your chest.")
                setFeedbackCooldown(60)
              }
            }
          } else {
            setFeedbackCooldown(c => c - 1)
          }
        }
        rafId = requestAnimationFrame(frame)
      }
      frame()
    }
    init()

    return () => {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      const v = videoRef.current
      if (v?.srcObject) v.srcObject.getTracks().forEach(t => t.stop())
    }
  }, [speak])

  return (
    <div className="space-y-2">
      <div className="text-xs opacity-70">{ready ? "Camera on. Do a squat to get cues." : "Initializing camera & model…"}</div>
      <div className="rounded-lg overflow-hidden border bg-black">
        <canvas ref={canvasRef} className="w-full h-auto max-h-48" />
      </div>
      <video ref={videoRef} className="hidden" />
    </div>
  )
}
