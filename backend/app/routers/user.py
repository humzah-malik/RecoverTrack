# backend/app/routers/user.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.routers.auth import get_current_user
from app.database import SessionLocal
from app.models import User, DailyLog, SplitTemplate
from app.schemas import UserOut, UserUpdate
from app.utils.nutrition import compute_nutrition_profile

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
def update_profile(
    updates: UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user: User = db.query(User).get(current_user.id)
    incoming = updates.dict(exclude_unset=True)

     # Validate split_template_id if provided
    if "split_template_id" in incoming:
        split_id = incoming["split_template_id"]
        tpl = db.query(SplitTemplate).filter(SplitTemplate.id == split_id).first()
        if not tpl or (tpl.user_id is not None and tpl.user_id != current_user.id):
            raise HTTPException(403, "You can't use this split.")

    # apply all incoming fields
    for field, value in incoming.items():
        setattr(user, field, value)

    # if auto_nutrition enabled and any relevant field changed, then recompute
    if user.auto_nutrition and set(incoming) & {
        "age","sex","weight","weight_unit",
        "height","height_unit","goal",
        "activity_level","weight_target",
        "weight_target_unit"
    }:
        cals, macros = compute_nutrition_profile(user)
        user.maintenance_calories = cals
        user.macro_targets = macros

    db.commit()
    db.refresh(user)
    return user

@router.post("/me/reset", status_code=204)
def reset_account(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(DailyLog).filter(DailyLog.user_id == current_user.id).delete()
    db.commit()

@router.post("/me/complete-onboarding", status_code=204)
def complete_onboarding(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user: User = db.query(User).get(current_user.id)
    user.has_completed_onboarding = True
    db.commit()

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user: User = db.query(User).get(current_user.id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    # delete all user-related data first if you want to cascade manually:
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)