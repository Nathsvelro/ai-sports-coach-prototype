
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..db import SessionLocal, engine, Base
from .. import models, schemas

Base.metadata.create_all(bind=engine)
router = APIRouter(prefix="/api/diary", tags=["diary"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/goals", response_model=schemas.GoalOut)
def create_goal(payload: schemas.GoalCreate, db: Session = Depends(get_db)):
    g = models.Goal(title=payload.title, target_date=payload.target_date)
    db.add(g)
    db.commit()
    db.refresh(g)
    return g

@router.get("/goals", response_model=List[schemas.GoalOut])
def list_goals(db: Session = Depends(get_db)):
    return db.query(models.Goal).order_by(models.Goal.id.desc()).all()

@router.post("/milestones", response_model=schemas.MilestoneOut)
def add_milestone(payload: schemas.MilestoneCreate, db: Session = Depends(get_db)):
    m = models.Milestone(goal_id=payload.goal_id, note=payload.note)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@router.post("/entries", response_model=schemas.DiaryOut)
def add_entry(payload: schemas.DiaryCreate, db: Session = Depends(get_db)):
    e = models.DiaryEntry(
        note=payload.note,
        mood=payload.mood,
        fatigue=payload.fatigue,
        sleep_hours=payload.sleep_hours,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return e

@router.get("/entries", response_model=List[schemas.DiaryOut])
def list_entries(db: Session = Depends(get_db)):
    return db.query(models.DiaryEntry).order_by(models.DiaryEntry.id.desc()).all()
