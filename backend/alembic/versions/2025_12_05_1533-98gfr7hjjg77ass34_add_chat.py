"""add-timestamps-to-streams-and-delete-flag

Revision ID: 98gfr7hjjg77ass34
Revises: 992fe0c099c8
Create Date: 2025-12-05 15:33:45.468836

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '98gfr7hjjg77ass34'
down_revision: Union[str, None] = '992fe0c099c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table('chats',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('stream_id', postgresql.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['stream_id'], ['streams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stream_id')
    )
    op.create_index('idx_chats_stream_id', 'chats', ['stream_id'])
    
    # Создаем ENUM
    message_status = postgresql.ENUM('CREATED', 'IN_QUEUE', 'DELIVERED', 'FAILED', name='messagestatus')
    message_status.create(op.get_bind())
    
    op.create_table('messages',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('chat_id', postgresql.UUID(), nullable=False),
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('status', message_status, nullable=False, server_default='CREATED'),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['chat_id'], ['chats.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_messages_chat_id', 'messages', ['chat_id'])
    op.create_index('idx_messages_user_id', 'messages', ['user_id'])
    op.create_index('idx_messages_status', 'messages', ['status'])
    op.create_index('idx_messages_chat_created', 'messages', ['chat_id', 'created_at'])

def downgrade():
    op.drop_index('idx_messages_chat_created', 'messages')
    op.drop_index('idx_messages_status', 'messages')
    op.drop_index('idx_messages_user_id', 'messages')
    op.drop_index('idx_messages_chat_id', 'messages')
    op.drop_table('messages')
    
    message_status = postgresql.ENUM('CREATED', 'IN_QUEUE', 'DELIVERED', 'FAILED', name='messagestatus')
    message_status.drop(op.get_bind())
    
    op.drop_index('idx_chats_stream_id', 'chats')
    op.drop_table('chats')