from typing import Any


def get_coverage_by_id(
    planning_item: dict[str, Any], coverage_id: str, field: str | None = "coverage_id"
) -> dict[str, Any] | None:
    return next(
        (coverage for coverage in planning_item.get("coverages") or [] if coverage.get(field) == coverage_id),
        None,
    )
