
# Personalized AI Sports Coach — Web App (Hackathon Prototype)

A mobile-style web app that demos a **Personalized AI Sports Coach** with real‑time voice coaching via **ElevenLabs Conversational AI Agents**, pose/form analysis using the phone/PC camera, weather-aware exercise suggestions (OpenWeather), optional local events (Ticketmaster), BLE heart‑rate demo, and a conversational diary for goals & milestones.

> ⚠️ This is a hackathon‑friendly prototype. For production, harden auth, handle errors, and add tests.

## Features
- **Real-time voice coaching** using ElevenLabs **WebRTC** connection to an Agent (browser mic → agent → streamed voice back).
- **Form analysis** (squats demo) with **MediaPipe Pose**; sends conversational feedback to the agent (e.g., “Keep your back straight”).
- **Dynamic plan suggestions** with **OpenAI** based on **weather** (OpenWeatherMap) and optional **local events** (Ticketmaster).
- **Wearables**: Web Bluetooth demo for **Heart Rate Service** (0x180D) + manual metrics.
- **Conversational diary**: log goals, notes, and milestones.
- **Mobile simulation UI** with an iPhone/Android‑style frame.

## Quick start

### 1) Create `.env` from template
```bash
cp backend/.env.example backend/.env
```
Set:
- `ELEVENLABS_API_KEY` — ElevenLabs key
- `ELEVENLABS_AGENT_ID` — Conversational AI Agent ID
- `OPENAI_API_KEY` — for exercise suggestions
- `OPENWEATHER_API_KEY` — for weather
- *(optional)* `TICKETMASTER_API_KEY` — for events
- `ALLOWED_ORIGINS=http://localhost:5173`

### 2) Backend (FastAPI)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3) Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### 4) Try it
- **Connect Coach** to start the voice session.
- **Pose Coach** → perform a bodyweight squat to get cues.
- **Diary** → set a goal and add entries.
- **Plan** → tap “Suggest Plan” for weather-aware workout ideas.

## Notes & Docs
- ElevenLabs **Agent WebSockets / WebRTC token** flow (server fetches token; client starts session).
- MediaPipe **Pose Landmarker** (web).
- OpenWeather **Current Weather** API.
- Ticketmaster **Discovery** API (optional).

## Safety
This is **not medical advice**. Stop if you feel pain or dizziness.
