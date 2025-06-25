# backend/get_token.py
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

email = os.getenv("TEST_USER_EMAIL")
password = os.getenv("TEST_USER_PASSWORD")

try:
    supabase.auth.sign_up({"email": email, "password": password})
except Exception:
    pass

auth = supabase.auth.sign_in_with_password({"email": email, "password": password})
token = auth.get("access_token") or auth.get("data", {}).get("access_token")

print("JWT:", token)