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
dbg(f"🟢 recovery_dataset.csv has {len(df):,} rows (through {last_date.date()})")
last_date = df["date"].max()
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
("🔎 Example raw log:", pprint.pformat(new_logs[0])[:300] + " …")

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
        tpl_cache[tpl_id] = rec.data["type"] if not rec.error else ""
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
        sess_cache[key] = rec.data["muscle_groups"] if not rec.error else []
    muscles = sess_cache[key]

    dbg(f"→ tpl {tpl_id} session {session_name!r} → type={t_type!r} muscles={muscles[:3]}…")

    return t_type, muscles

# Flatten nested columns
def normalize_log(row):
    base = {
        "user_id": row.get("user_id"),
        "date": pd.to_datetime(row.get("date")),
        "sleep_h": None,  # will compute below
        "sleep_quality": row.get("sleep_quality"),
        "resting_hr": row.get("resting_hr"),
        "hrv": row.get("hrv"),
        "trained": row.get("trained"),
        "total_sets": row.get("total_sets"),
        "failure_sets": row.get("failure_sets"),
        "total_rir": row.get("total_rir"),
        "cal_deficit_pct": None,  # will compute
        "protein_pct": None,
        "carbs_pct": None,
        "fat_pct": None,
        "stress": row.get("stress"),
        "motivation": row.get("motivation"),
        "soreness": row.get("soreness"),
        "water_intake_l": row.get("water_intake_l"),
        "split_type": row.get("split"),
        "muscle_groups": json.dumps(row.get("muscle_groups", [])),  # keep as JSON string
        "age": row.get("age", 25),      # fallback/defaults
        "sex": row.get("sex", "Male"),
        "height": row.get("height", 175),
        "weight": row.get("weight", 75.0),
        "goal": row.get("goal", "maintenance"),
        "split_type": "",
        "muscle_groups": "[]",
        "age": None,
        "sex": None,
        "height": None,
        "weight": None,
        "goal": None,
        "activity_level": None,
        "recovery_rating": row.get("recovery_rating"),
    }

    u = user_cache.get(row.get("user_id"), {})
    base.update(
        age=u.get("age"),
        sex=u.get("sex"),
        height=u.get("height"),
        weight=u.get("weight"),
        goal=u.get("goal"),
        activity_level=u.get("activity_level"),
    )

    # --- split_type  &  muscle_groups -------------------------------
    tpl_id       = row.get("split_template_id")
    session_name = row.get("split")            # e.g. "Legs & Shoulders"
    t_type, mg   = lookup_split_info(tpl_id, session_name)
    base["split_type"]    = t_type or ""       # "" safer than wrong value
    base["muscle_groups"] = json.dumps(mg)     # keep schema same as before


    # Compute sleep hours
    sh, eh = row.get("sleep_start"), row.get("sleep_end")
    try:
        if sh and eh:
            shh, shm = map(int, sh.split(":"))
            ehh, ehm = map(int, eh.split(":"))
            mins = (ehh * 60 + ehm) - (shh * 60 + shm)
            if mins < 0:
                mins += 24 * 60
            base["sleep_h"] = mins / 60.0
    except:
        base["sleep_h"] = None

    # Compute macro percentages
    macros = row.get("macros", {})
    targets = row.get("macro_targets", {"protein": 1, "carbs": 1, "fat": 1})

    try:
        base["protein_pct"] = (macros.get("protein", 0) / targets.get("protein", 1)) * 100
        base["carbs_pct"]   = (macros.get("carbs",   0) / targets.get("carbs", 1)) * 100
        base["fat_pct"]     = (macros.get("fat",     0) / targets.get("fat", 1)) * 100
    except:
        base["protein_pct"] = base["carbs_pct"] = base["fat_pct"] = None

    # Cal deficit percentage
    cals = row.get("calories")
    maint = row.get("maintenance_calories", 2000)
    if cals is not None:
        base["cal_deficit_pct"] = (cals - maint) / maint
    
    dbg("📝 Row normalised:", {k: base[k] for k in ('user_id','date','split_type','muscle_groups','sleep_h','cal_deficit_pct')})
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