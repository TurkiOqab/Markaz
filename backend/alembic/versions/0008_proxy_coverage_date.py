"""proxy coverage date

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0008'
down_revision: Union[str, Sequence[str], None] = '0007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('proxies', sa.Column('coverage_date', sa.Date(), nullable=True))
    # Backfill existing rows: coverage = same as the delegator's shift date.
    op.execute("UPDATE proxies SET coverage_date = shift_date WHERE coverage_date IS NULL")


def downgrade() -> None:
    op.drop_column('proxies', 'coverage_date')
