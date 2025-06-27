from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import SplitTemplate, SplitSession
from app.schemas import SplitTemplateCreate, SplitTemplateOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/splits", tags=["splits"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/", response_model=list[SplitTemplateOut])
def list_splits(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SplitTemplate).filter(
        (SplitTemplate.is_preset == 1) |
        (SplitTemplate.user_id == current_user.id)
    ).all()

@router.post("/", response_model=SplitTemplateOut, status_code=201)
def create_split(data: SplitTemplateCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    tpl = SplitTemplate(
        user_id=current_user.id,
        name=data.name,
        type=data.type,
        is_preset=0
    )
    db.add(tpl); db.flush()
    for s in data.sessions:
        db.add(SplitSession(
            template_id=tpl.id,
            name=s.name,
            muscle_groups=s.muscle_groups
        ))
    db.commit(); db.refresh(tpl)
    return tpl

@router.put("/{tpl_id}", response_model=SplitTemplateOut)
def update_split(tpl_id: str, data: SplitTemplateCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    tpl = db.get(SplitTemplate, tpl_id)
    if not tpl or tpl.user_id != current_user.id or tpl.is_preset:
        raise HTTPException(403, "Cannot modify this template")
    tpl.name = data.name
    tpl.type = data.type
    tpl.sessions.clear()
    for s in data.sessions:
        tpl.sessions.append(SplitSession(name=s.name, muscle_groups=s.muscle_groups))
    db.commit(); db.refresh(tpl)
    return tpl

@router.delete("/{tpl_id}", status_code=204)
def delete_split(tpl_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    tpl = db.get(SplitTemplate, tpl_id)
    if not tpl or tpl.user_id != current_user.id or tpl.is_preset:
        raise HTTPException(403, "Cannot delete this template")
    db.delete(tpl); db.commit()