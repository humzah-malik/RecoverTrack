#!/usr/bin/env python3
import os
import pandas as pd
from supabase import create_client, Client
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ----- locate the CSV wherever the trainer wrote it -----
ROOT = Path(__file__).resolve().parents[2]  # repo root
candidates = [
    ROOT / "user_recovery_heads.csv",
    ROOT / "backend" / "user_recovery_heads.csv",
]
csv_path = next((p for p in candidates if p.exists()), None)

if not csv_path:
    print("⚠️  no heads CSV, skipping")
    exit(0)

print(f"📄 Using heads CSV at: {csv_path}")
df = pd.read_csv(csv_path)
print(f"Upserting {len(df)} heads…")

# ----- ALWAYS use the service key for writes -----
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not url or not key:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/KEY")
    exit(1)

supabase: Client = create_client(url, key)

# ----- filter to existing users -----
all_heads = df.to_dict(orient="records")
user_ids = [h["user_id"] for h in all_heads]
resp = supabase.table("users").select("id").in_("id", user_ids).execute()
existing_ids = {u["id"] for u in (resp.data or [])}
filtered = [h for h in all_heads if h["user_id"] in existing_ids]
filtered_out = len(all_heads) - len(filtered)
if filtered_out:
    print(f"⚠️ Filtered out {filtered_out} head(s) for missing users")
if not filtered:
    print("⚠️ No valid heads to upsert, exiting")
    exit(0)

# ----- upsert -----
upsert_resp = (
    supabase
    .table("user_recovery_heads")
    .upsert(filtered, on_conflict="user_id")
    .execute()
)

data = getattr(upsert_resp, "data", None)
if not data:
    print(f"❌ Upsert failed. Raw response: {upsert_resp}")
else:
    print(f"✅ Upsert succeeded, wrote {len(data)} row(s).")