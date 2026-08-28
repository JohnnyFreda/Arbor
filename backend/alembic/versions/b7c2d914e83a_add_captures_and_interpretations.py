"""add captures and interpretations

Introduces the capture-first input model: raw user input (captures) stored
independently of AI-proposed structure (interpretations). See ADR-001, ADR-002.

Revision ID: b7c2d914e83a
Revises: f474e175bf8d
Create Date: 2026-08-27

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b7c2d914e83a'
down_revision = 'f474e175bf8d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'captures',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('source', sa.String(), nullable=False, server_default='desktop'),
        sa.Column('processing_status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('client_token', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'client_token', name='unique_user_client_token'),
    )
    op.create_index(op.f('ix_captures_id'), 'captures', ['id'], unique=False)
    op.create_index(op.f('ix_captures_user_id'), 'captures', ['user_id'], unique=False)
    op.create_index(op.f('ix_captures_processing_status'), 'captures', ['processing_status'], unique=False)

    op.create_table(
        'interpretations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('capture_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('suggested_title', sa.String(), nullable=True),
        sa.Column('suggested_project_id', sa.Integer(), nullable=True),
        sa.Column('suggested_priority', sa.String(), nullable=True),
        sa.Column('suggested_next_action', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='proposed'),
        sa.Column('model', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['capture_id'], ['captures.id'], ),
        sa.ForeignKeyConstraint(['suggested_project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_interpretations_id'), 'interpretations', ['id'], unique=False)
    op.create_index(op.f('ix_interpretations_capture_id'), 'interpretations', ['capture_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_interpretations_capture_id'), table_name='interpretations')
    op.drop_index(op.f('ix_interpretations_id'), table_name='interpretations')
    op.drop_table('interpretations')
    op.drop_index(op.f('ix_captures_processing_status'), table_name='captures')
    op.drop_index(op.f('ix_captures_user_id'), table_name='captures')
    op.drop_index(op.f('ix_captures_id'), table_name='captures')
    op.drop_table('captures')
