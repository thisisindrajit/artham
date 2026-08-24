"""update generated story target age range

Revision ID: a13e18f0b001
Revises: 758f8d74baca
Create Date: 2026-08-21 18:02:00

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a13e18f0b001"
down_revision: str | Sequence[str] | None = "758f8d74baca"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Allow generated stories for the product's 13-18 age range."""
    op.drop_constraint(
        op.f("ck_generated_story_versions_valid_target_age"),
        "generated_story_versions",
        type_="check",
    )
    op.create_check_constraint(
        op.f("ck_generated_story_versions_valid_target_age"),
        "generated_story_versions",
        "target_age >= 13 AND target_age <= 18",
    )


def downgrade() -> None:
    """Restore the legacy 15-23 age range."""
    op.drop_constraint(
        op.f("ck_generated_story_versions_valid_target_age"),
        "generated_story_versions",
        type_="check",
    )
    op.create_check_constraint(
        op.f("ck_generated_story_versions_valid_target_age"),
        "generated_story_versions",
        "target_age >= 15 AND target_age <= 23",
    )
