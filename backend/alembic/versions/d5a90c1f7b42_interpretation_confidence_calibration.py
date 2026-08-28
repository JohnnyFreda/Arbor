"""record whether an interpretation's confidence is calibrated

Small local models emit ~0.9 for everything, including answers they got wrong.
The value is still stored -- it is needed to calibrate anything later -- but it
is withheld from the API until the producing provider has earned it.

Recorded at write time rather than derived from the model name later: whether a
given run was calibrated is a fact about that run.

Revision ID: d5a90c1f7b42
Revises: c3f81a2b57d9
Create Date: 2026-08-28

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd5a90c1f7b42'
down_revision = 'c3f81a2b57d9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing rows came from Claude, whose confidence is treated as meaningful,
    # so the backfill default is true.
    op.add_column(
        'interpretations',
        sa.Column(
            'confidence_is_calibrated',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


def downgrade() -> None:
    op.drop_column('interpretations', 'confidence_is_calibrated')
