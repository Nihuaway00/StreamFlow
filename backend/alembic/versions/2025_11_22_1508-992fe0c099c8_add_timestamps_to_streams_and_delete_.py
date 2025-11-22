"""add-timestamps-to-streams-and-delete-flag

Revision ID: 992fe0c099c8
Revises: 9cb5bb1e9e49
Create Date: 2025-11-22 15:08:40.465836

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '992fe0c099c8'
down_revision: Union[str, None] = '9cb5bb1e9e49'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('streams', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('streams', sa.Column('deleted_at', sa.DateTime(), nullable=True))



def downgrade() -> None:
    op.drop_column('streams', 'deleted_at')
    op.drop_column('streams', 'is_deleted')