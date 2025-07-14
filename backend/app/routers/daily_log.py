from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from io import BytesIO
import pandas as pd
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List
from app.database import SessionLocal
from app.models import DailyLog, SplitSession, SplitTemplate
from app.schemas import DailyLogCreate, DailyLogOut
from app.routers.auth import get_current_user
from app.routers.recovery import predict as predict_recovery_score
from fastapi import Request
import json
import logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["daily-log"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

FRIENDLY_HDRS = {
    "Date":                     "date",
    "Trained (Y/N)":            "trained",
    "Sleep Start (HH:MM)":      "sleep_start",
    "Sleep End (HH:MM)":        "sleep_end",
    "Sleep Quality (1-5)":      "sleep_quality",
    "Resting HR":               "resting_hr",
    "HRV":                      "hrv",
    "Soreness (list)":          "soreness",
    "Stress (1-5)":             "stress",
    "Motivation (1-5)":         "motivation",
    "Total Sets":               "total_sets",
    "Failure Sets":             "failure_sets",
    "Total RIR":                "total_rir",
    "Calories":                 "calories",
    "Macros (JSON)":            "macros",
    "Water Intake (L)":         "water_intake_l",
    "Split Session":                    "split",
    "Recovery Rating (0-100)":  "recovery_rating",
}

@router.post("/daily-log", response_model=DailyLogOut, status_code=201)
def upsert_daily_log(
    payload: DailyLogCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    print("Payload received by /daily-log:", data)
    # makes sure trained lands in the int4 column
    if "trained" in data:
        data["trained"] = 1 if data["trained"] else 0

    # Manual override normalization (insert this)
    tpl_id = data.get("split_template_id") or current_user.split_template_id
    manual = data.get("split")
    if manual and tpl_id:
        sessions = (
            db.query(SplitSession)
              .filter_by(template_id=tpl_id)
              .all()
        )
        # map lowercase → canonical
        names = {s.name.lower(): s.name for s in sessions}
        key = manual.strip().lower()
        if key in names:
            data["split"] = names[key]
        else:
            raise HTTPException(400, f"Session '{manual}' not in template")

    # Fallback inference if no manual override and trained
    elif data.get("trained") and tpl_id:
        sessions = (
            db.query(SplitSession)
              .filter_by(template_id=tpl_id)
              .order_by(SplitSession.id)
              .all()
        )
        if sessions:
            idx = payload.date.weekday() % len(sessions)
            data["split"] = sessions[idx].name
            data["split_template_id"] = tpl_id  

    # upserts by (user_id, date)
    obj = (
        db.query(DailyLog)
          .filter_by(user_id=current_user.id, date=payload.date)
          .first()
    )
    if obj:
        for k, v in data.items():
            setattr(obj, k, v)
    else:
        obj = DailyLog(user_id=current_user.id, **data)
        db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/daily-log", response_model=DailyLogOut)
def get_daily_log(
    date: date = Query(..., description="YYYY-MM-DD"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    obj = (
        db.query(DailyLog)
        .filter_by(user_id=current_user.id, date=date)
        .first()
    )
    if not obj:
        raise HTTPException(404, "Log not found")
    return obj

@router.get("/daily-log/history", response_model=list[DailyLogOut])
def get_history(
    start: date = Query(..., description="YYYY-MM-DD"),
    days:  int  = Query(7, ge=1, le=31),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all daily-logs for the period [start, start days - 1].
    """
    end = start + timedelta(days=days-1)

    logger.info(f"[GET /daily-log/history] user={current_user.id} start={start} days={days} → end={end}")

    logs = (
        db.query(DailyLog)
          .filter(
            DailyLog.user_id == current_user.id,
            DailyLog.date >= start,
            DailyLog.date <= end,
          )
          .order_by(DailyLog.date.asc())
          .all()
    )

    found_dates = [str(l.date) for l in logs]
    logger.info(f"[GET /daily-log/history] → found {len(logs)} logs: {found_dates}")
    return logs

@router.post("/daily-log/bulk-import", status_code=201)
async def bulk_import_logs(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        content = await file.read()
        # 1) Read headers correctly (don’t skip the real header row)
        if file.filename.lower().endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=0)
        elif file.filename.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(BytesIO(content), header=0)
        else:
            raise HTTPException(400, "Unsupported file type")

        # 2) Map your friendly headers to internal names
        df.rename(columns=lambda c: FRIENDLY_HDRS.get(c.strip(), c.strip()), inplace=True)    

        # 3) Drop the “info” row if it doesn’t have a valid date
        #    (this is the embedded row that just lists valid splits)
        if "date" not in df.columns:
            raise HTTPException(400, detail="Missing required 'Date' column in upload")

        # Attempt to parse; invalid rows get NaT
        parsed = pd.to_datetime(df["date"], errors="coerce")
        keep = parsed.notna()
        dropped = len(df) - keep.sum()
        if keep.sum() == 0:
            raise HTTPException(400, detail="No valid dates found in upload")
        if dropped:
            # optional: log how many you dropped
            print(f"⚠️ Dropped {dropped} rows with invalid date values")

        df = df.loc[keep].copy()
        df["date"] = parsed.dt.date
        print("✅ Dates being imported:", df["date"].tolist())

        # Replace any remaining NaNs

        df.fillna(value=pd.NA, inplace=True)

        processed = duplicates = errors = 0

        for idx, row in df.iterrows():
            try:
                db.rollback()
            except:
                pass
            try:
                row = row.where(pd.notnull(row), None)
                date_value = row["date"]
                trained_raw = str(row.get("trained", "")).strip().upper()
                trained = 1 if trained_raw in ["Y", "YES", "TRUE", "1"] else 0

                raw_soreness = row.get("soreness")
                if raw_soreness:
                   try:
                       lst = json.loads(raw_soreness)
                       # e.g. store the first element (or compute sum/avg as you prefer)
                       soreness_val = int(lst[0])
                   except Exception:
                       soreness_val = None
                else:
                   soreness_val = None

                log_data = {
                    "date": date_value,
                    "trained": trained,
                    "sleep_start": row.get("sleep_start"),
                    "sleep_end": row.get("sleep_end"),
                    "sleep_quality": row.get("sleep_quality"),
                    "resting_hr": row.get("resting_hr"),
                    "hrv": row.get("hrv"),
                    "soreness": soreness_val,
                    "stress": row.get("stress"),
                    "motivation": row.get("motivation"),
                    "total_sets": row.get("total_sets"),
                    "failure_sets": row.get("failure_sets"),
                    "total_rir": row.get("total_rir"),
                    "calories": row.get("calories"),
                    "macros": json.loads(row.get("macros")) if row.get("macros") else None,
                    "water_intake_l": row.get("water_intake_l"),
                    "split": row.get("split"),
                    "recovery_rating": row.get("recovery_rating"),
                    # "workout": row.get("workout")
                }

                obj = (
                    db.query(DailyLog)
                      .filter_by(user_id=current_user.id, date=date_value)
                      .first()
                )
                if obj:
                    duplicates += 1
                    for k, v in log_data.items():
                        setattr(obj, k, v)
                else:
                    processed += 1
                    new_log = DailyLog(user_id=current_user.id, **log_data)
                    db.add(new_log)

                try:
                   db.flush()
                except Exception:
                   # if flush fails, rollback this transaction chunk so we can continue
                   db.rollback()
                   errors += 1
                   continue

                fake_req = Request(scope={"type": "http"})
                fake_req._body = json.dumps({          # monkey-patch body
                    "user_id": str(current_user.id),
                    "date":    str(date_value)
                }).encode()

                try:
                    await predict_recovery_score(
                        request=fake_req,
                        debug=False,
                        db=db,
                        me=current_user
                    )
                except Exception as rec_e:
                    # log and keep going
                    print(f"⚠️ Recovery prediction failed on row {idx}: {rec_e}")
                    errors += 1
                    continue
            
            except HTTPException:
                raise
            except Exception as e:
                # Log the full traceback so you can inspect it in your console
                import traceback; traceback.print_exc()
                db.rollback()
                errors += 1
                # DO NOT re-raise — just move on to the next row
                continue

        db.commit()

        return {
            "processed": processed,
            "duplicates": duplicates,
            "errors": errors,
            "message": f"Imported {processed} rows, {duplicates} updated, {errors} errors"
        }

    except Exception as e:
        # if we raised an HTTPException above, re-raise it directly
        if isinstance(e, HTTPException):
            raise

        import traceback; traceback.print_exc()
        raise HTTPException(500, detail=f"Bulk import failed: {e}")

@router.get(
    "/daily-log/template.csv",
    summary="Download CSV template for bulk daily-log import",
)
def download_daily_log_template_csv(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1) fetch the user's split sessions
    sessions = (
        db.query(SplitSession)
          .filter_by(template_id=current_user.split_template_id)
          .order_by(SplitSession.id)
          .all()
    )
    names = [s.name for s in sessions]

    # 2) define friendly headers + sample rows
    cols = [
        "Date",
        "Trained (Y/N)",
        "Sleep Start (HH:MM)",
        "Sleep End (HH:MM)",
        "Sleep Quality (1-5)",
        "Resting HR",
        "HRV",
        "Soreness (list)",
        "Stress (1-5)",
        "Motivation (1-5)",
        "Total Sets",
        "Failure Sets",
        "Total RIR",
        "Calories",
        "Macros (JSON)",
        "Water Intake (L)",
        "Split Session",
        "Recovery Rating (0-100)",
    ]

    # 3) three example rows (training, rest, training)
    rows = [
        # Training day
        ["2025-07-12", "Y", "23:30", "07:10", 4, 55, 85, "[2,1,0,0]", 2, 4,
         20, 2, 25, 2700, '{"protein":170,"carbs":320,"fat":80}', 2.7, names[0], 78],
        # Rest day
        ["2025-07-13", "N", "23:45", "07:20", 3, 57, 82, "[3,2,1,0]", 3, 3,
         "", "", "", 2500, '{"protein":160,"carbs":300,"fat":75}', 2.3, names[1] if len(names)>1 else "", 69],
        # Another training day
        ["2025-07-14", "Y", "00:05", "08:00", 5, 54, 88, "[1,0,0,0]", 1, 5,
         18, 1, 22, 2900, '{"protein":180,"carbs":330,"fat":85}', 3.0, names[2] if len(names)>2 else "", 82],
    ]

    # 4) info row listing valid splits
    info = [""] * len(cols)
    info[cols.index("Split Session")] = "VALID SPLITS SESSIONS → " + ", ".join(names)

    df = pd.DataFrame([info] + rows, columns=cols)

    # 5) stream back as CSV
    buf = BytesIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=daily_log_template.csv"},
    )

@router.get(
    "/daily-log/template.xlsx",
    summary="Download XLSX template for bulk daily-log import",
)
def download_daily_log_template_xlsx(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # same session lookup + rows as above
    sessions = (
        db.query(SplitSession)
          .filter_by(template_id=current_user.split_template_id)
          .order_by(SplitSession.id)
          .all()
    )
    names = [s.name for s in sessions]

    cols = [
        "Date",
        "Trained (Y/N)",
        "Sleep Start (HH:MM)",
        "Sleep End (HH:MM)",
        "Sleep Quality (1-5)",
        "Resting HR",
        "HRV",
        "Soreness (1-5)",
        "Stress (1-5)",
        "Motivation (1-5)",
        "Total Sets",
        "Failure Sets",
        "Total RIR",
        "Calories",
        "Macros (JSON)",
        "Water Intake (L)",
        "Split",
        "Recovery Rating (0-100)",
    ]
    rows = [
        ["2025-07-12", "Y", "23:30", "07:10", 4, 55, 85, "[2,1,0,0]", 2, 4,
         20, 2, 25, 2700, '{"protein":170,"carbs":320,"fat":80}', 2.7, names[0], 78],
        ["2025-07-13", "N", "23:45", "07:20", 3, 57, 82, "[3,2,1,0]", 3, 3,
         "", "", "", 2500, '{"protein":160,"carbs":300,"fat":75}', 2.3, names[1] if len(names)>1 else "", 69],
        ["2025-07-14", "Y", "00:05", "08:00", 5, 54, 88, "[1,0,0,0]", 1, 5,
         18, 1, 22, 2900, '{"protein":180,"carbs":330,"fat":85}', 3.0, names[2] if len(names)>2 else "", 82],
    ]
    info = [""] * len(cols)
    info[cols.index("Split")] = "VALID SPLITS SESSIONS → " + ", ".join(names)

    df = pd.DataFrame([info] + rows, columns=cols)

    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Template")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=daily_log_template.xlsx"},
    )