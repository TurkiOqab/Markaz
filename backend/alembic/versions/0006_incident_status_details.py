"""incident status + details

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0006'
down_revision: Union[str, Sequence[str], None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'incidents',
        sa.Column('status', sa.String(length=20), nullable=False, server_default='غير مكتمل'),
    )
    op.add_column('incidents', sa.Column('details', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('incidents', 'details')
    op.drop_column('incidents', 'status')
