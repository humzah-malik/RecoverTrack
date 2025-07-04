#!/usr/bin/env python3
import os
import json
import pandas as pd
from datetime import datetime
from pathlib import Path
from supabase import create_client, Client

# Load current CSV
csv_path = Path("backend/recovery_dataset.csv")
if not csv_path.exists():
    raise FileNotFoundError("recovery_dataset.csv not found in backend.")

df = pd.read_csv(csv_path, parse_dates=["date"])
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

# Convert json to DataFrame
new_df = pd.DataFrame(new_logs)

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
        "activity_level": row.get("activity_level", "moderate"),
        "recovery_rating": row.get("recovery_rating"),
    }

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

    return base

# Apply normalization
processed = [normalize_log(row) for row in new_logs]
new_df_flat = pd.DataFrame(processed)

# Ensure same columns and types
new_df_flat = new_df_flat[df.columns]

# Append to dataset
df = pd.concat([df, new_df_flat], ignore_index=True)
df.to_csv(csv_path, index=False)
print(f"Appended {len(new_df_flat)} new row(s) to recovery_dataset.csv")