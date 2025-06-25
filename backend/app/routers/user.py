# backend/app/routers/user.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.routers.auth import get_current_user
from app.database import SessionLocal
from app.models import User
from app.schemas import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/me", response_model=UserOut)
def read_profile(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    return user

@router.patch("/me", response_model=UserOut)
def update_profile(updates: UserUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == current_user.id).first()
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(db_user, field, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/me/reset", status_code=204)
def reset_account(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(DailyLog).filter(DailyLog.user_id == current_user.id).delete()
    db.commit()
