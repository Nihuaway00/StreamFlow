"""add_themes

Revision ID: 163b39b02dfa
Revises: b03a697fc7c8
Create Date: 2025-11-06 19:13:21.057372

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '163b39b02dfa'
down_revision: Union[str, None] = 'b03a697fc7c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Создаем таблицу themes если ее нет
    op.create_table('themes',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=255), nullable=False),
                    sa.Column('description', sa.Text(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('name')
                    )

    # 2. Создаем таблицу user_theme
    op.create_table('user_theme',
                    sa.Column('id', sa.UUID(), nullable=False),
                    sa.Column('user_id', sa.UUID(), nullable=False),
                    sa.Column('theme_id', sa.Integer(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
                    sa.ForeignKeyConstraint(['theme_id'], ['themes.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id')
                    )

    # 3. Создаем таблицу stream_theme
    op.create_table('stream_theme',
                    sa.Column('id', sa.UUID(), nullable=False),
                    sa.Column('stream_id', sa.UUID(), nullable=False),
                    sa.Column('theme_id', sa.Integer(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
                    sa.ForeignKeyConstraint(['stream_id'], ['streams.id'], ondelete='CASCADE'),
                    sa.ForeignKeyConstraint(['theme_id'], ['themes.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id')
                    )

    # 4. Создаем индексы
    op.create_index('ix_user_theme_user_id', 'user_theme', ['user_id'])
    op.create_index('ix_user_theme_theme_id', 'user_theme', ['theme_id'])
    op.create_index('ix_user_theme_user_theme', 'user_theme', ['user_id', 'theme_id'], unique=True)

    op.create_index('ix_stream_theme_stream_id', 'stream_theme', ['stream_id'])
    op.create_index('ix_stream_theme_theme_id', 'stream_theme', ['theme_id'])

    op.create_index('ix_themes_id', 'themes', ['id'])
    op.create_index('ix_themes_name', 'themes', ['name'])

    # 5. Наполняем тематики
    themes_table = sa.table('themes',
                            sa.column('name', sa.String),
                            sa.column('description', sa.Text)
                            )


def downgrade():
    op.drop_table('stream_theme')
    op.drop_table('user_theme')
    op.drop_table('themes')
