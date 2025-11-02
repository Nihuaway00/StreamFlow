from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_roles():
    """Инициализация ролей в БД при запуске приложения"""
    from app.models.role import Role
    from app.consts.role_dict import roles_dict

    db = SessionLocal()
    try:
        # Проверяем и создаем роли из словаря
        for role_name, role_id in roles_dict.items():
            existing_role = db.query(Role).filter(Role.id == role_id).first()
            if not existing_role:
                new_role = Role(id=role_id, name=role_name)
                db.add(new_role)
                print(f"Создана роль: {role_name} (id={role_id})")

        db.commit()
        print("Инициализация ролей завершена")
    except Exception as e:
        print(f"Ошибка при инициализации ролей: {e}")
        db.rollback()
    finally:
        db.close()