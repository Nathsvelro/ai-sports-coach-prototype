
import os
import httpx
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "")

router = APIRouter(prefix="/api/elevenlabs", tags=["elevenlabs"])

@router.get("/webrtc-token")
async def get_webrtc_token():
    if not ELEVENLABS_API_KEY or not ELEVENLABS_AGENT_ID:
        raise HTTPException(status_code=500, detail="Missing ElevenLabs configuration")
    url = "https://api.elevenlabs.io/v1/convai/conversation/token"
    params = {"agent_id": ELEVENLABS_AGENT_ID}
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url, headers=headers, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Failed to get token: {r.text}")
        data = r.json()
        return {"token": data.get("token")}
