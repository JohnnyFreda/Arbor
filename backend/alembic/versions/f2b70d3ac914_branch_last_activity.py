"""record when a branch last saw activity

Attaching evidence writes to a join table, so the branch row's updated_at
never moves. Branches are meant to surface because something happened to
them, not because someone edited them. See ADR-010.

Revision ID: f2b70d3ac914
Revises: e1c4b8a20f37
Create Date: 2026-08-28

"""
from alembic import op
import sqlalchemy as sa

revision = 'f2b70d3ac914'
down_revision = 'e1c4b8a20f37'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'branches',
        sa.Column(
            'last_activity_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=True,
        ),
    )
    op.create_index(
        op.f('ix_branches_last_activity_at'), 'branches', ['last_activity_at'], unique=False
    )
    # Existing branches have seen no activity since they were made, so their
    # creation time is the honest answer -- not the moment of this migration.
    op.execute('UPDATE branches SET last_activity_at = created_at')


def downgrade() -> None:
    op.drop_index(op.f('ix_branches_last_activity_at'), table_name='branches')
    op.drop_column('branches', 'last_activity_at')
