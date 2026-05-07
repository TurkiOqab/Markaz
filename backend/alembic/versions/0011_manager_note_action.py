"""manager note: action_taken field

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-04 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0011'
down_revision: Union[str, Sequence[str], None] = '0010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('manager_notes', sa.Column('action_taken', sa.String(2000), nullable=True))


def downgrade() -> None:
    op.drop_column('manager_notes', 'action_taken')
