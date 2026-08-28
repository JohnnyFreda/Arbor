"""add tasks

Actionable work accepted out of the inbox. Only the actionable interpretation
types (task, blocker) produce a row here. See ADR-006.

Revision ID: c3f81a2b57d9
Revises: b7c2d914e83a
Create Date: 2026-08-27

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c3f81a2b57d9'
down_revision = 'b7c2d914e83a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.String(), nullable=False, server_default='task'),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='open'),
        sa.Column('priority', sa.String(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('source_capture_id', sa.Integer(), nullable=True),
        sa.Column('source_interpretation_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['source_capture_id'], ['captures.id'], ),
        sa.ForeignKeyConstraint(['source_interpretation_id'], ['interpretations.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)
    op.create_index(op.f('ix_tasks_project_id'), 'tasks', ['project_id'], unique=False)
    op.create_index(op.f('ix_tasks_status'), 'tasks', ['status'], unique=False)
    op.create_index(op.f('ix_tasks_source_capture_id'), 'tasks', ['source_capture_id'], unique=False)
    op.create_index(op.f('ix_tasks_source_interpretation_id'), 'tasks', ['source_interpretation_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tasks_source_interpretation_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_source_capture_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_status'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_project_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_user_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_table('tasks')
