"""add user profile fields

Revision ID: b03a697fc7c8
Revises: 7b509f342cd9
Create Date: 2025-11-05 23:40:14.309747

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b03a697fc7c8'
down_revision: Union[str, None] = '7b509f342cd9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('first_name', sa.String(length=100), nullable=True)) # 
    op.add_column('users', sa.Column('last_name', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('date_of_birth', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('country', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('website', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    pass


def downgrade() -> None:
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'website')
    op.drop_column('users', 'city')
    op.drop_column('users', 'country')
    op.drop_column('users', 'date_of_birth')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
    pass