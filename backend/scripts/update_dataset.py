#!/usr/bin/env python3
import os
import json
import os, json, pprint, argparse
import pandas as pd
from datetime import datetime
from pathlib import Path
from supabase import create_client, Client

# CLI flag
parser = argparse.ArgumentParser(description="Append new daily-log rows to recovery_dataset.csv")
parser.add_argument("--debug", action="store_true", help="verbose logging")
args, unknown = parser.parse_known_args()
DEBUG = args.debug

def dbg(*msg, **kw):
    """print only if --debug is passed"""
    if DEBUG:
        print(*msg, **kw)

# Load current CSV
csv_path = Path("backend/recovery_dataset.csv")
if not csv_path.exists():
    raise FileNotFoundError("recovery_dataset.csv not found in backend.")

df = pd.read_csv(csv_path, parse_dates=["date"])
last_date = df["date"].max()
dbg(f"🟢 recovery_dataset.csv has {len(df):,} rows (through {last_date.date()})")
print(f"🕐 Last training date: {last_date.date()}")

# Connect to Supabase
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
if not url or not key:
    raise EnvironmentError("Missing SUPABASE_URL or SUPABASE_KEY")

supabase: Client = create_client(url, key)

# Fetch new daily logs with recovery_rating after last date
response = (
    supabase.table("daily_logs")
    .select("*")
    .gt("date", last_date.isoformat())
    .not_.is_("recovery_rating", "null")
    .execute()
)

new_logs = response.data
if not new_logs:
    print("No new logs found.")
    exit(0)

print(f"Found {len(new_logs)} new log(s)")
dbg("🔎 Example raw log:", pprint.pformat(new_logs[0])[:300] + " …")

# Convert json to DataFrame
new_df = pd.DataFrame(new_logs)

unique_ids = list({row["user_id"] for row in new_logs})

user_rows = (
    supabase.table("users")
    .select(
        "id, age, sex, height, weight, goal, activity_level,"
        "maintenance_calories, macro_targets"
    )
    .in_("id", unique_ids)
    .execute()
).data or []

user_cache = {u["id"]: u for u in user_rows}
dbg(f"👥 Pulled static attrs for {len(user_cache)} user(s):", list(user_cache)[:5])

# ---------------------------------------------------------------------
# 2⃣  Small helpers to resolve split_type & muscle_groups
#     (cached so we only hit Supabase once per template / session)
# ---------------------------------------------------------------------
tpl_cache, sess_cache = {}, {}

def lookup_split_info(tpl_id: str, session_name: str):
    # Template → type  ("strength" / "cardio" / "mixed")
    if tpl_id and tpl_id not in tpl_cache:
        rec = (
            supabase.table("split_templates")
            .select("id,type")
            .eq("id", tpl_id)
            .single()
            .execute()
        )
        tpl_cache[tpl_id] = (rec.data or {}).get("type", "")
    t_type = tpl_cache.get(tpl_id, "")

    # Session → muscle_groups  (list[str])
    key = (tpl_id, session_name or "")
    if key not in sess_cache:
        rec = (
            supabase.table("split_sessions")
            .select("muscle_groups")
            .eq("template_id", tpl_id)
            .eq("name", session_name or "")
            .single()
            .execute()
        )
        sess_cache[key] = (rec.data or {}).get("muscle_groups", [])
    muscles = sess_cache[key]

    dbg(f"→ tpl {tpl_id} session {session_name!r} → type={t_type!r} muscles={muscles[:3]}…")

    return t_type, muscles

# Flatten nested columns
def normalize_log(row):
    # ---------- 0️⃣  static skeleton (no duplicates) ------------------
    base = {
        "user_id":        row["user_id"],
        "date":           pd.to_datetime(row["date"]),
        "sleep_h":        None,          # ← we’ll fill below
        "sleep_quality":  row.get("sleep_quality"),
        "resting_hr":     row.get("resting_hr"),
        "hrv":            row.get("hrv"),
        "trained":        row.get("trained"),
        "total_sets":     row.get("total_sets"),
        "failure_sets":   row.get("failure_sets"),
        "total_rir":      row.get("total_rir"),
        # macros / energy – filled later
        "cal_deficit_pct": None,
        "protein_pct":     None,
        "carbs_pct":       None,
        "fat_pct":         None,
        # subjective
        "stress":        row.get("stress"),
        "motivation":    row.get("motivation"),
        "soreness":      row.get("soreness"),
        "water_intake_l":row.get("water_intake_l"),
        # placeholder; will be resolved by lookup_split_info
        "split_type":    "",
        "muscle_groups": "[]",
        # static user attrs – will be patched from user_cache
        "age":            None,
        "sex":            None,
        "height":         None,
        "weight":         None,
        "goal":           None,
        "activity_level": None,
        # label
        "recovery_rating": row.get("recovery_rating"),
    }

    # ---------- 1️⃣  pull static user attributes ----------------------
    u = user_cache.get(row["user_id"], {})
    base.update(
        age=u.get("age"),
        sex=u.get("sex"),
        height=u.get("height"),
        weight=u.get("weight"),
        goal=u.get("goal"),
        activity_level=u.get("activity_level"),
    )

    # ---------- 2️⃣  split type & muscle groups -----------------------
    tpl_id       = row.get("split_template_id")
    session_name = row.get("split")                 # e.g. "Legs & Shoulders"
    t_type, mg   = lookup_split_info(tpl_id, session_name)
    base["split_type"]    = t_type or ""            # blank safer than wrong
    base["muscle_groups"] = json.dumps(mg)

    # ---------- 3️⃣  sleep hours --------------------------------------
    sh, eh = row.get("sleep_start"), row.get("sleep_end")
    try:
        if sh and eh:
            shh, shm = map(int, sh.split(":"))
            ehh, ehm = map(int, eh.split(":"))
            mins = (ehh*60+ehm) - (shh*60+shm)
            if mins < 0:
                mins += 24*60
            base["sleep_h"] = mins / 60.0
    except Exception:
        pass                                             # keep None

    # ---------- 4️⃣  macro percentages -------------------------------
    macros   = row.get("macros") or {}
    targets_from_log  = row.get("macro_targets") or {}            # almost always {}
    targets_from_user = (user_cache.get(row["user_id"], {})       # may be {}
                        .get("macro_targets") or {})
    targets = {**targets_from_user, **targets_from_log}           # log overrides user

    # ❷ helper to avoid huge numbers / div-by-zero
    def pct(actual, target):
        try:
            return (actual / target) * 100 if target else None
        except ZeroDivisionError:
            return None

    base["protein_pct"] = (macros.get("protein",0) / targets.get("protein",1)) * 100
    base["carbs_pct"]   = (macros.get("carbs",  0) / targets.get("carbs",  1)) * 100
    base["fat_pct"]     = (macros.get("fat",    0) / targets.get("fat",    1)) * 100

    # ---------- 5️⃣  calorie deficit ---------------------------------
    cals  = row.get("calories")
    maint = row.get("maintenance_calories", 2000)
    if cals is not None:
        base["cal_deficit_pct"] = (cals - maint) / maint

    dbg("📝 Row normalised:", {k: base[k] for k in
         ("user_id","date","split_type","muscle_groups","sleep_h","cal_deficit_pct")})
    return base

# Apply normalization
processed = [normalize_log(row) for row in new_logs]
new_df_flat = pd.DataFrame(processed)
dbg("📄 First 3 processed rows:\n" + new_df_flat.head(3).to_string(index=False))

# Ensure same columns and types
new_df_flat = new_df_flat[df.columns]

# Append to dataset
df = pd.concat([df, new_df_flat], ignore_index=True)
dbg(f"💾 New total rows in CSV: {len(df):,}")
df.to_csv(csv_path, index=False)
print(f"Appended {len(new_df_flat)} new row(s) to recovery_dataset.csv")