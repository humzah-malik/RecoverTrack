import os
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET = os.getenv("JWT_SECRET_KEY")
ALGO    = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_EXPIRES  = int(os.getenv("JWT_ACCESS_EXPIRES", "900"))
REFRESH_EXPIRES = int(os.getenv("JWT_REFRESH_EXPIRES", "604800"))

def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    return pwd_context.verify(pw, hashed)

def create_access_token(sub: str) -> str:
    payload = {"sub": sub, "type": "access", "exp": datetime.utcnow() + timedelta(seconds=ACCESS_EXPIRES)}
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def create_refresh_token(sub: str) -> str:
    payload = {"sub": sub, "type": "refresh", "exp": datetime.utcnow() + timedelta(seconds=REFRESH_EXPIRES)}
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET, algorithms=[ALGO])