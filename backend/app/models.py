
from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from sqlalchemy.sql import func
from .db import Base

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    target_date = Column(String(40), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, index=True)
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    id = Column(Integer, primary_key=True, index=True)
    note = Column(Text)
    mood = Column(String(32), nullable=True)
    fatigue = Column(Integer, nullable=True)  # 1-10
    sleep_hours = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
