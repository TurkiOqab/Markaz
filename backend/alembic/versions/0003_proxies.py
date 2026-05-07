"""proxies

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0003'
down_revision: Union[str, Sequence[str], None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'proxies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('delegator_id', sa.Integer(), nullable=False),
        sa.Column('substitute_id', sa.Integer(), nullable=False),
        sa.Column('shift_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('settled', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('settled_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['delegator_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['substitute_id'], ['employees.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_proxies_settled', 'proxies', ['settled'])
    op.create_index('ix_proxies_substitute', 'proxies', ['substitute_id'])


def downgrade() -> None:
    op.drop_index('ix_proxies_substitute', table_name='proxies')
    op.drop_index('ix_proxies_settled', table_name='proxies')
    op.drop_table('proxies')
