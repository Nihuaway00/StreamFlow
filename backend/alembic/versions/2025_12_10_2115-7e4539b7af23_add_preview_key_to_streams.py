"""add_preview_key_to_streams

Revision ID: 7e4539b7af23
Revises: 98gfr7hjjg77ass34
Create Date: 2025-12-10 21:15:29.289610

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e4539b7af23'
down_revision: Union[str, None] = '98gfr7hjjg77ass34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('streams', sa.Column('preview_key', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('streams', 'preview_key')