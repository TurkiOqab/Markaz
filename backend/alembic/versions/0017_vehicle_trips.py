"""vehicle trips (movement orders / odometer tracking)

Revision ID: 0017
Revises: 0016
Create Date: 2026-05-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0017'
down_revision: Union[str, Sequence[str], None] = '0016'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'vehicle_trips',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('vehicle_id', sa.Integer(), sa.ForeignKey('vehicles.id'), nullable=False),
        sa.Column('start_at', sa.DateTime(), nullable=False),
        sa.Column('start_odometer', sa.Integer(), nullable=False),
        sa.Column('end_at', sa.DateTime(), nullable=True),
        sa.Column('end_odometer', sa.Integer(), nullable=True),
        sa.Column('driver_id', sa.Integer(), sa.ForeignKey('employees.id'), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index(
        'ix_vehicle_trips_vehicle_id', 'vehicle_trips', ['vehicle_id'], unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_vehicle_trips_vehicle_id', table_name='vehicle_trips')
    op.drop_table('vehicle_trips')
