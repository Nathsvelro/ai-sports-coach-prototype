
import os
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .routers import elevenlabs, suggestions, diary
import aiohttp
import asyncio

ELEVENLABS_WS_URL = "wss://api.elevenlabs.io/v1/stream"

load_dotenv()

app = FastAPI(title="AI Sports Coach Backend")

allowed = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
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

            # Ejecutar envío y recepción en paralelo
            await asyncio.gather(forward_to_eleven(), forward_to_client())
