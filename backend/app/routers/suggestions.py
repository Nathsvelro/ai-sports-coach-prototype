
import os
from typing import Optional
import httpx
from fastapi import APIRouter, Query, HTTPException
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
TICKETMASTER_API_KEY = os.getenv("TICKETMASTER_API_KEY", "")

router = APIRouter(prefix="/api/suggest", tags=["suggestions"])

@router.get("/exercises")
async def suggest_exercises(
    lat: float = Query(...),
    lon: float = Query(...),
    city: Optional[str] = Query(None),
    sport: Optional[str] = Query("running"),
):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    weather = None
    if OPENWEATHER_API_KEY:
        w_url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
        async with httpx.AsyncClient(timeout=20) as client:
            wr = await client.get(w_url, params=params)
            if wr.status_code == 200:
                weather = wr.json()
    events = None
    if TICKETMASTER_API_KEY and city:
        e_url = "https://app.ticketmaster.com/discovery/v2/events.json"
        params = {"apikey": TICKETMASTER_API_KEY, "city": city, "classificationName": "sports", "size": 5}
        async with httpx.AsyncClient(timeout=20) as client:
            er = await client.get(e_url, params=params)
            if er.status_code == 200:
                events = er.json()

    weather_snip = weather or {}
    event_snip = events or {}
    prompt = f"""
You are an elite sports coach. Propose a tailored {sport} plan for TODAY given:
- Weather (OpenWeather JSON): {weather_snip}
- Nearby sports events (Ticketmaster JSON, optional): {event_snip}

Output:
1) Brief 1-sentence overview.
2) Warm-up (minutes + drills).
3) Main set (intervals/effort with HR or RPE).
4) Technique focus cues (short imperatives).
5) Safety notes for weather.
6) If outdoors is poor, give an indoor alternative.
7) 3 short exercise ideas to try this week related to local events (if any).
"""
    client = OpenAI(api_key=OPENAI_API_KEY)
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
    )
    text = resp.choices[0].message.content
    return {"recommendations": text, "weather": weather, "events": events}
