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
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:  # Лучше через context manager
        try:
            for role_name, role_id in roles_dict.items():
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


async def init_themes():
    from app.models import Theme
    from sqlalchemy import select
    from app.consts.theme_dict import ThemeEnum

    async with AsyncSessionLocal() as db:
        themes = ThemeEnum.to_list()
        try:
            for theme_name, theme_id in themes:
                result = await db.execute(
                    select(Theme).where(Theme.id == theme_id)
                )
                existing_theme = result.scalar_one_or_none()

                if not existing_theme:
                    new_theme = Theme(id=theme_id, name=theme_name)
                    db.add(new_theme)
                    print(f"Создана тема: {theme_name} (id={theme_id})")
            await db.commit()
            print("Инициализация тем завершена")
        except Exception as e:
            print(f"Ошибка: {e}")
            await db.rollback()
            raise
