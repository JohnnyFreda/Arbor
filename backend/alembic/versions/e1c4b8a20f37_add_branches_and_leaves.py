"""add branches and leaves

A branch is a line of work; a leaf is normalized evidence from a foreign
system hanging off it. Native rows -- captures, tasks, entries -- are linked
rather than copied. See ADR-009.

Revision ID: e1c4b8a20f37
Revises: d5a90c1f7b42
Create Date: 2026-08-28

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e1c4b8a20f37'
down_revision = 'd5a90c1f7b42'
branch_labels = None
depends_on = None


def _link_table(name: str, other_table: str, other_column: str) -> None:
    """Composite primary key: attaching the same thing twice is a no-op."""
    op.create_table(
        name,
        sa.Column('branch_id', sa.Integer(), nullable=False),
        sa.Column(other_column, sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['branch_id'], ['branches.id'], ),
        sa.ForeignKeyConstraint([other_column], [f'{other_table}.id'], ),
        sa.PrimaryKeyConstraint('branch_id', other_column),
    )


def upgrade() -> None:
    op.create_table(
        'branches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_branches_id'), 'branches', ['id'], unique=False)
    op.create_index(op.f('ix_branches_user_id'), 'branches', ['user_id'], unique=False)
    op.create_index(op.f('ix_branches_project_id'), 'branches', ['project_id'], unique=False)
    op.create_index(op.f('ix_branches_status'), 'branches', ['status'], unique=False)

    op.create_table(
        'leaves',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('source_id', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('author', sa.String(), nullable=True),
        sa.Column('url', sa.String(), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        # Syncing must be idempotent: seeing the same pull request twice has to
        # update one leaf, not grow a second.
        sa.UniqueConstraint('user_id', 'source', 'source_id', name='unique_user_source_item'),
    )
    op.create_index(op.f('ix_leaves_id'), 'leaves', ['id'], unique=False)
    op.create_index(op.f('ix_leaves_user_id'), 'leaves', ['user_id'], unique=False)
    op.create_index(op.f('ix_leaves_source'), 'leaves', ['source'], unique=False)
    op.create_index(op.f('ix_leaves_occurred_at'), 'leaves', ['occurred_at'], unique=False)

    _link_table('branch_leaves', 'leaves', 'leaf_id')
    _link_table('branch_captures', 'captures', 'capture_id')
    _link_table('branch_tasks', 'tasks', 'task_id')
    _link_table('branch_entries', 'entries', 'entry_id')


def downgrade() -> None:
    for name in ('branch_entries', 'branch_tasks', 'branch_captures', 'branch_leaves'):
        op.drop_table(name)
    op.drop_index(op.f('ix_leaves_occurred_at'), table_name='leaves')
    op.drop_index(op.f('ix_leaves_source'), table_name='leaves')
    op.drop_index(op.f('ix_leaves_user_id'), table_name='leaves')
    op.drop_index(op.f('ix_leaves_id'), table_name='leaves')
    op.drop_table('leaves')
    op.drop_index(op.f('ix_branches_status'), table_name='branches')
    op.drop_index(op.f('ix_branches_project_id'), table_name='branches')
    op.drop_index(op.f('ix_branches_user_id'), table_name='branches')
    op.drop_index(op.f('ix_branches_id'), table_name='branches')
    op.drop_table('branches')
