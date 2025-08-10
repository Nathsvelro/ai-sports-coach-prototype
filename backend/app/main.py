
import os
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .routers import elevenlabs, suggestions, diary
from .opencv.opencv import procesar_frame, text_to_text_ollama, text_to_speech
import cv2
import json
import random
import aiohttp
import asyncio
import time

ELEVENLABS_WS_URL = "wss://api.elevenlabs.io/v1/stream"

load_dotenv()

app = FastAPI(title="AI Sports Coach Backend")

allowed = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(elevenlabs.router)
app.include_router(suggestions.router)
app.include_router(diary.router)

@app.get("/api/health")
def health():
    return {"ok": True}


@app.websocket("/ws/voice")
async def voice_chat(websocket: WebSocket):
    await websocket.accept()
    
    # Check if this is a phrase detection request
    try:
        # First, try to receive a text message to check the scenario
        message = await websocket.receive_text()
        
        # Check if it's the personalized workout phrase
        if message.lower().strip() == "give me a personalize workout":
            # Send true to enable personalized workout
            await websocket.send_text("true")
            await websocket.close()
            return
            
    except Exception:
        # If no text message, proceed with the original audio streaming logic
        pass
    
    # Original audio streaming logic (ElevenLabs connection)
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(ELEVENLABS_WS_URL, headers={
            "xi-api-key": "TU_API_KEY"
        }) as eleven_ws:

            async def forward_to_eleven():
                while True:
                    audio_chunk = await websocket.receive_bytes()
                    await eleven_ws.send_bytes(audio_chunk)

            async def forward_to_client():
                async for msg in eleven_ws:
                    if msg.type == aiohttp.WSMsgType.BINARY:
                        await websocket.send_bytes(msg.data)
                    elif msg.type == aiohttp.WSMsgType.TEXT:
                        await websocket.send_text(msg.data)

            # Execute sending and receiving in parallel
            await asyncio.gather(forward_to_eleven(), forward_to_client())


@app.websocket("/ws/video")
async def websocket_video(websocket: WebSocket):
    await websocket.accept()

    exercise = None
    history = []
    start_time = time.time()

    try:
        while True:
            message = await websocket.receive_json()
            data = json.loads(message)

            if "ejercicio" in data and exercise is None:
                exercise = data["ejercicio"]

            if "frame" in data and data["frame"]:
                # Process frame
                angulos, simetrias = procesar_frame(data['frame'])

                # Save to history
                history.append({
                    "timestamp": time.time(),
                    "angulos": angulos,
                    "simetrias": simetrias
                })

            # keep 15 seconds
            if time.time() - start_time >= 15:
                # call to ollama
                response = text_to_text_ollama(datos=random.sample(history[5:-6],3), ejercicio=exercise)
                # send to elevenlabs
                audio = text_to_speech(datos=response)
                
                # Send audio and text to client
                await websocket.send_json({
                    "audio": audio,
                    "texto": response
                })

                # Close WebSocket connection
                await websocket.close()
                break

    except Exception as e:
        print("WebSocket closed:", e)
    finally:
        cv2.destroyAllWindows()
