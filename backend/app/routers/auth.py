from fastapi import APIRouter, Depends, HTTPException, status, Header, File, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token
)
from uuid import uuid4
from app.schemas import UserCreate, UserLogin, UserOut, Token
from app.supabase_admin import supabase_admin

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid auth scheme")
    try:
        data = decode_token(token)
        if data.get("type") != "access":
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = db.get(User, data["sub"])
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=data.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    new = User(email=data.email, password_hash=hash_password(data.password))
    db.add(new); db.commit(); db.refresh(new)
    return new

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bad email or password")
    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": create_refresh_token(str(user.id))
    }

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/refresh", response_model=Token)
def refresh(authorization: str = Header(...)):
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid auth scheme")
    try:
        data = decode_token(token)
        if data.get("type") != "refresh":
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    return {
        "access_token": create_access_token(data["sub"]),
        "refresh_token": create_refresh_token(data["sub"])
    }


@router.post("/avatar", summary="Upload user avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or "." not in file.filename:
        raise HTTPException(400, "Invalid file")

    contents = await file.read()
    ext = file.filename.rsplit(".", 1)[-1]
    path = f"{current_user.id}/{uuid4()}.{ext}"
    
    result = supabase_admin.storage.from_("avatars").upload(path, contents, {"upsert": False})
    if hasattr(result, "error") and result.error:
        raise HTTPException(500, f"Supabase upload error: {result.error.message}")
    elif getattr(result, "status_code", 200) >= 400:
        raise HTTPException(500, f"Supabase upload failed: HTTP {result.status_code}")

    public_url = supabase_admin.storage.from_("avatars").get_public_url(path)
    return {"publicUrl": public_url}