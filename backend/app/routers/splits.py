from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import SplitTemplate, SplitSession, UserSplitTemplate
from app.schemas import SplitTemplateCreate, SplitTemplateOut
from app.routers.auth import get_current_user
from uuid import UUID

router = APIRouter(prefix="/splits", tags=["splits"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/", response_model=list[SplitTemplateOut])
def list_splits(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    # All preset templates
    presets = db.query(SplitTemplate).filter(SplitTemplate.is_preset == 1).all()

    # Custom templates owned by the user
    customs = db.query(SplitTemplate).filter(SplitTemplate.user_id == current_user.id).all()

    # Adopted presets (linked from user_split_templates)
    adopted_links = db.query(UserSplitTemplate).filter_by(user_id=current_user.id, is_custom=False).all()
    adopted_ids = [link.template_id for link in adopted_links]
    adopted = db.query(SplitTemplate).filter(SplitTemplate.id.in_(adopted_ids)).all()

    return presets + customs + adopted

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

@router.post("/adopt", status_code=201)
def adopt_split_template(
    template_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate the template exists and is global
    tpl = db.query(SplitTemplate).filter(SplitTemplate.id == template_id).first()
    if not tpl or tpl.user_id is not None:
        raise HTTPException(404, "Preset not found or not global")

    # Check if user already adopted it
    exists = db.query(UserSplitTemplate).filter_by(
        user_id=current_user.id,
        template_id=template_id,
        is_custom=False
    ).first()
    if exists:
        raise HTTPException(409, "Already adopted")

    # Insert adoption record
    record = UserSplitTemplate(
        user_id=current_user.id,
        template_id=template_id,
        is_custom=False
    )
    db.add(record)
    db.commit()
    return {"message": "Preset adopted"}

@router.post("/clone", status_code=201)
def clone_split(
    template_id: str,  # use str here since IDs are stored as str UUIDs
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # 1. Fetch the template to clone
    tpl = db.query(SplitTemplate).filter(SplitTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    # 2. Create a new SplitTemplate row
    cloned = SplitTemplate(
        user_id=current_user.id,
        name=f"Copy of {tpl.name}",
        type=tpl.type,
        is_preset=0
    )
    db.add(cloned)
    db.flush()  # get ID for foreign key use below

    # 3. Clone all sessions
    for session in tpl.sessions:
        db.add(SplitSession(
            template_id=cloned.id,
            name=session.name,
            muscle_groups=session.muscle_groups
        ))

    # 4. Link it in user_split_templates as a custom split
    db.add(UserSplitTemplate(
        user_id=current_user.id,
        template_id=cloned.id,
        is_custom=True
    ))

    db.commit()
    return {"message": "Template cloned successfully", "template_id": cloned.id}
