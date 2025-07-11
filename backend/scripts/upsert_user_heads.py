#!/usr/bin/env python3
import os, pandas as pd
from supabase import create_client, Client
from pathlib import Path

csv_path = Path("user_recovery_heads.csv")
if not csv_path.exists():
    print("⚠️  no heads CSV, skipping")
    exit(0)

df = pd.read_csv(csv_path)
print(f"Upserting {len(df)} heads…")

url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

data = df.to_dict(orient="records")
supabase.table("user_recovery_heads").upsert(data, on_conflict="user_id").execute()
print("✅ done")