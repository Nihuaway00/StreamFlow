from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
	# Проверка существующего email
	if db.query(User).filter(User.email == user_data.email).first():
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Email already registered"
		)

	# Проверка существующего username
	if db.query(User).filter(User.username == user_data.username).first():
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Username already taken"
		)

	# Создание пользователя
	new_user = User(
		email=user_data.email,
		username=user_data.username,
		hashed_password=hash_password(user_data.password)
	)

	db.add(new_user)
	db.commit()
	db.refresh(new_user)

	return new_user


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
	user = db.query(User).filter(User.email == user_data.email).first()

	if not user or not verify_password(user_data.password, user.hashed_password):
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Incorrect email or password",
			headers={"WWW-Authenticate": "Bearer"},
		)

	access_token = create_access_token(data={"sub": user.email})

	return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout():
	return {"message": "Successfully logged out"}