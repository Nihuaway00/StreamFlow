from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession)
Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_roles():
    from app.models.role import Role
    from app.consts.role_dict import roles_dict
    from sqlalchemy import select  # ← Добавь импорт

    async with AsyncSessionLocal() as db:  # Лучше через context manager
        try:
            for role_name, role_id in roles_dict.items():
                # ✅ Правильный async запрос
                result = await db.execute(
                    select(Role).where(Role.id == role_id)
                )
                existing_role = result.scalar_one_or_none()

                if not existing_role:
                    new_role = Role(id=role_id, name=role_name)
                    db.add(new_role)
                    print(f"Создана роль: {role_name} (id={role_id})")

            await db.commit()
            print("Инициализация ролей завершена")
        except Exception as e:
            print(f"Ошибка: {e}")
            await db.rollback()
            raise
