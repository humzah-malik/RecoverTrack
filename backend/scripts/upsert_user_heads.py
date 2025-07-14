#!/usr/bin/env python3
import os
import pandas as pd
from supabase import create_client, Client
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

# 1️⃣ Locate the CSV of per-user heads
csv_path = Path("user_recovery_heads.csv")
if not csv_path.exists():
    print("⚠️  no heads CSV, skipping")
    exit(0)

df = pd.read_csv(csv_path)
print(f"Upserting {len(df)} heads…")

# 2️⃣ Load Supabase creds (fallback to SERVICE key)
url = os.getenv("SUPABASE_URL") or "https://vbzfldnjgyhdwegesyja.supabase.co"
key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("❌ Missing SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_KEY")
    exit(1)

# 3️⃣ Connect to Supabase
supabase: Client = create_client(url, key)

# 4️⃣ Filter heads to existing users to satisfy FK constraint
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

data = filtered

# 5️⃣ Upsert into user_recovery_heads
upsert_resp = (
    supabase
    .table("user_recovery_heads")
    .upsert(data, on_conflict="user_id")
    .execute()
)

# 6️⃣ Report result
try:
    data = upsert_resp.data
except AttributeError:
    data = None

if not data:
    print(f"❌ Upsert failed. Raw response: {upsert_resp}")
else:
    print(f"✅ Upsert succeeded, wrote {len(data)} row(s).")