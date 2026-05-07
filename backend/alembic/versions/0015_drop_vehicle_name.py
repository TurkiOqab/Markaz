"""drop vehicle.name (reverted: type is the only identifier on the card)

Revision ID: 0015
Revises: 0014
Create Date: 2026-05-06 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0015'
down_revision: Union[str, Sequence[str], None] = '0014'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('vehicles', 'name')


def downgrade() -> None:
    op.add_column('vehicles', sa.Column('name', sa.String(120), nullable=True))
