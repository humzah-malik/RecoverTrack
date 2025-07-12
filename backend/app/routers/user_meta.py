# backend/app/routers/user_meta.py
from fastapi import APIRouter
from app.utils.nutrition import TDEE_MULTIPLIERS

router = APIRouter(prefix="/meta", tags=["meta"])

@router.get("/activity-levels", summary="Get available activity levels")
def get_activity_levels():
    return list(TDEE_MULTIPLIERS.keys())