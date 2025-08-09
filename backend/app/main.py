
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .routers import elevenlabs, suggestions, diary

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
