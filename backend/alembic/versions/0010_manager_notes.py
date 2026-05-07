"""manager notes per employee

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-04 01:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0010'
down_revision: Union[str, Sequence[str], None] = '0009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'manager_notes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('employee_id', sa.Integer(), sa.ForeignKey('employees.id'), nullable=False),
        sa.Column('author_chief_id', sa.Integer(), sa.ForeignKey('chiefs.id'), nullable=True),
        sa.Column('text', sa.String(2000), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('ix_manager_notes_employee_id', 'manager_notes', ['employee_id'])


def downgrade() -> None:
    op.drop_index('ix_manager_notes_employee_id', table_name='manager_notes')
    op.drop_table('manager_notes')
