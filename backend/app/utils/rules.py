# app/utils/rules.py

import operator
from typing import Any, Dict, List, Optional
from sqlalchemy import Column, String, JSON, Table
from sqlalchemy.orm import Session, declarative_base
from app.models import User  # make sure User is imported so SQLAlchemy sees the same Base

Base = declarative_base()

# Map textual operators to Python functions
OPERATOR_MAP = {
    "<":  operator.lt,
    "<=": operator.le,
    ">":  operator.gt,
    ">=": operator.ge,
    "==": operator.eq,
    "!=": operator.ne,
}

class RuleTemplate(Base):
    __tablename__ = "rule_templates"
    id          = Column(String, primary_key=True)
    description = Column(String, nullable=False)
    conditions  = Column(JSON, nullable=False)   # e.g. [ {"field":"sleep_h","operator":"<","value":6} ]
    advice      = Column(String, nullable=False)
    for_goals   = Column(JSON, nullable=True)    # e.g. ["cutting","bulking"] or NULL
    timeframe   = Column(String, nullable=False) # "daily" | "weekly" | "monthly"

def evaluate_rules_from_context(
    ctx: Dict[str, Any],
    timeframe: str,
    user: User,
    db: Session
) -> List[str]:
    """
    Load all RuleTemplate rows for this timeframe (and matching user.goal, if for_goals is set),
    test their JSON conditions against ctx, and return all advice strings whose conditions pass.
    """
    # Fetch matching templates
    all_rules: List[RuleTemplate] = (
        db.query(RuleTemplate)
          .filter(RuleTemplate.timeframe == timeframe)
          .all()
    )

    advice_list: List[str] = []
    for rule in all_rules:
        # Skip if rule.for_goals is non-null and doesn't include the user's goal
        if rule.for_goals:
            if user.goal not in rule.for_goals:
                continue

        # Evaluate each condition; all must be True
        conditions: List[Dict[str, Any]] = rule.conditions
        passed = True
        for cond in conditions:
            field    = cond["field"]
            op_str   = cond["operator"]
            target   = cond["value"]
            actual   = ctx.get(field)

            op_func = OPERATOR_MAP.get(op_str)
            if op_func is None:
                passed = False
                break

            # If field is missing in ctx, treat as failure
            try:
                if actual is None or not op_func(actual, target):
                    passed = False
                    break
            except Exception:
                passed = False
                break

        # If all conditions passed, collect the advice
        if passed:
            advice_list.append(rule.advice)

    return advice_list