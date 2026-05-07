"""vehicle deployment line (الأول / الثاني)

Revision ID: 0014
Revises: 0013
Create Date: 2026-05-06 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0014'
down_revision: Union[str, Sequence[str], None] = '0013'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'vehicles',
        sa.Column('line', sa.String(20), nullable=False, server_default='الأول'),
    )


def downgrade() -> None:
    op.drop_column('vehicles', 'line')
