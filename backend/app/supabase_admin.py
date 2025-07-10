from pathlib import Path
from dotenv import load_dotenv

# point at the .env in the parent directory of app/
env_path = Path(__file__).parent.parent / ".env"
print("→ Looking for .env at", env_path, "exists?", env_path.exists())

load_dotenv(env_path, override=True)

import os

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Missing Supabase env vars")

supabase_admin = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)