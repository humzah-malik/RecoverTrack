# app/routers/rule_templates.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import SessionLocal
from app.models import RuleTemplate
from app.schemas import (
    RuleTemplateCreate,
    RuleTemplateUpdate,
    RuleTemplateOut,
    EvaluateRulesPayload
)
from app.routers.auth import get_current_user
from app.models import User
from app.utils.rules import evaluate_rules_from_context

router = APIRouter(
    prefix="/rules",
    tags=["rules"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=RuleTemplateOut, status_code=status.HTTP_201_CREATED)
def create_rule(
    payload: RuleTemplateCreate,
    current_user: User = Depends(get_current_user),  # if you want to restrict rule ownership
    db: Session = Depends(get_db)
):
    # Optional: enforce unique id or generate
    rule = RuleTemplate(
        id=payload.id,
        description=payload.description,
        conditions=payload.conditions,
        advice=payload.advice,
        for_goals=payload.for_goals,
        timeframe=payload.timeframe
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.get("/", response_model=List[RuleTemplateOut])
def list_rules(
    timeframe: Optional[str] = None,
    goal: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RuleTemplate)
    if timeframe:
        query = query.filter(RuleTemplate.timeframe == timeframe)
    if goal:
        query = query.filter(
            (RuleTemplate.for_goals == None) |
            (RuleTemplate.for_goals.contains([goal]))
        )
    return query.all()

@router.get("/{rule_id}", response_model=RuleTemplateOut)
def get_rule(
    rule_id: str,
    db: Session = Depends(get_db)
):
    rule = db.query(RuleTemplate).get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.put("/{rule_id}", response_model=RuleTemplateOut)
def update_rule(
    rule_id: str,
    payload: RuleTemplateUpdate,
    db: Session = Depends(get_db)
):
    rule = db.query(RuleTemplate).get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    rule_id: str,
    db: Session = Depends(get_db)
):
    rule = db.query(RuleTemplate).get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()

@router.post("/evaluate", response_model=List[str])
def evaluate_rules_api(
    payload: EvaluateRulesPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    insights = evaluate_rules_from_context(payload.ctx, payload.timeframe, current_user, db)
    return insights