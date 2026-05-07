"""monthly rating axes (specialty/discipline/fitness/appearance)

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0009'
down_revision: Union[str, Sequence[str], None] = '0008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add the four new sub-score columns as nullable so we can backfill.
    op.add_column('monthly_ratings', sa.Column('specialty_score', sa.Integer(), nullable=True))
    op.add_column('monthly_ratings', sa.Column('discipline_score', sa.Integer(), nullable=True))
    op.add_column('monthly_ratings', sa.Column('fitness_score', sa.Integer(), nullable=True))
    op.add_column('monthly_ratings', sa.Column('appearance_score', sa.Integer(), nullable=True))

    # 2. Backfill: split the old `rating` (0-5) into four equal sub-scores of
    #    `round(rating * 5)` (each 0-25) so the new total ≈ old rating × 20.
    op.execute(
        "UPDATE monthly_ratings SET "
        "specialty_score = CAST(ROUND(rating * 5) AS INTEGER), "
        "discipline_score = CAST(ROUND(rating * 5) AS INTEGER), "
        "fitness_score = CAST(ROUND(rating * 5) AS INTEGER), "
        "appearance_score = CAST(ROUND(rating * 5) AS INTEGER) "
        "WHERE specialty_score IS NULL"
    )

    # 3. Recreate the table to enforce NOT NULL on the new columns and drop
    #    the old `rating` column. SQLite needs batch_alter_table for this.
    with op.batch_alter_table('monthly_ratings') as batch_op:
        batch_op.alter_column('specialty_score', existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column('discipline_score', existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column('fitness_score', existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column('appearance_score', existing_type=sa.Integer(), nullable=False)
        batch_op.drop_column('rating')


def downgrade() -> None:
    with op.batch_alter_table('monthly_ratings') as batch_op:
        batch_op.add_column(sa.Column('rating', sa.Numeric(3, 2), nullable=True))
    op.execute(
        "UPDATE monthly_ratings SET rating = "
        "(specialty_score + discipline_score + fitness_score + appearance_score) / 20.0"
    )
    with op.batch_alter_table('monthly_ratings') as batch_op:
        batch_op.alter_column('rating', existing_type=sa.Numeric(3, 2), nullable=False)
        batch_op.drop_column('appearance_score')
        batch_op.drop_column('fitness_score')
        batch_op.drop_column('discipline_score')
        batch_op.drop_column('specialty_score')
