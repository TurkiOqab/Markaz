"""roll_calls

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0004'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'roll_calls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('shift', sa.String(length=20), nullable=False),
        sa.Column('total_force', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('firefighters', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('drivers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('divers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('trainers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('on_mission', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('absent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('suspended', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('catering', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date'),
    )
    op.create_index('ix_roll_calls_date', 'roll_calls', ['date'])


def downgrade() -> None:
    op.drop_index('ix_roll_calls_date', table_name='roll_calls')
    op.drop_table('roll_calls')
