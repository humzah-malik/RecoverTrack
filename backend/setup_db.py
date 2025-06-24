from sqlalchemy import create_engine
from app.models import Base
from dotenv import load_dotenv
import os

load_dotenv()  # loads .env to get DATABASE_URL

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Create all tables
Base.metadata.create_all(engine)

print("✅ All tables created successfully.")