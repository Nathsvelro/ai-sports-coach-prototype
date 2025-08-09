
from pydantic import BaseModel
from typing import Optional, List

class GoalCreate(BaseModel):
    title: str
    target_date: Optional[str] = None

class GoalOut(BaseModel):
    id: int
    title: str
    target_date: Optional[str] = None
    class Config:
        from_attributes = True

class MilestoneCreate(BaseModel):
    goal_id: int
    note: str

class MilestoneOut(BaseModel):
    id: int
    goal_id: int
    note: str
    class Config:
        from_attributes = True

class DiaryCreate(BaseModel):
    note: str
    mood: Optional[str] = None
    fatigue: Optional[int] = None
    sleep_hours: Optional[float] = None

class DiaryOut(BaseModel):
    id: int
    note: str
    mood: Optional[str] = None
    fatigue: Optional[int] = None
    sleep_hours: Optional[float] = None
    class Config:
        from_attributes = True
