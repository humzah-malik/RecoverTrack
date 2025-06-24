from dotenv import load_dotenv
import os
from fastapi import FastAPI

load_dotenv()  

SUPABASE_URL = os.getenv("SUPABASE_URL")
DATABASE_URL = os.getenv("DATABASE_URL")
# etc.

app = FastAPI()

@app.get("/health")
def health():
    return {
      "supabase_url": os.getenv("SUPABASE_URL"),
      "database_url": os.getenv("DATABASE_URL")[:30] + "…"
    }
