"""vehicle yard position (drag-to-place layout on dashboard)

Revision ID: 0016
Revises: 0015
Create Date: 2026-05-06 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0016'
down_revision: Union[str, Sequence[str], None] = '0015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('vehicles', sa.Column('yard_x', sa.Float(), nullable=True))
    op.add_column('vehicles', sa.Column('yard_y', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('vehicles', 'yard_y')
    op.drop_column('vehicles', 'yard_x')
