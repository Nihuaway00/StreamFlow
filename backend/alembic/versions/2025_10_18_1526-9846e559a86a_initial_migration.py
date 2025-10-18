"""Initial migration: create users and streams tables

Revision ID: 001
Revises:
Create Date: 2025-10-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Создание таблицы users
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Создание таблицы streams
    op.create_table(
        'streams',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('stream_key', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='offline', nullable=True),
        sa.Column('viewers_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_streams_id'), 'streams', ['id'], unique=False)
    op.create_index(op.f('ix_streams_status'), 'streams', ['status'], unique=False)
    op.create_index('ix_streams_user_id', 'streams', ['user_id'], unique=False)


def downgrade() -> None:
    # Удаление таблиц в обратном порядке
    op.drop_index('ix_streams_user_id', table_name='streams')
    op.drop_index(op.f('ix_streams_status'), table_name='streams')
    op.drop_index(op.f('ix_streams_stream_key'), table_name='streams')
    op.drop_table('streams')

    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')