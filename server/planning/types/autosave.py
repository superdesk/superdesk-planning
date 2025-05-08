from .event import EventResourceModel
from .planning import PlanningResourceModel, PlanningCoverage
from pydantic import model_validator
from typing import Any


class EventAutosaveResourceModel(EventResourceModel):
    pass


class PlanningAutosaveResourceModel(PlanningResourceModel):
    @model_validator(mode="before")
    @classmethod
    def parse_dict(cls, values) -> dict[str, Any]:
        # Only parse coverages, don't modify IDs, otherwise on frontend
        # we can't know if the item is temporary
        for coverage in values.get("coverages", []):
            PlanningCoverage.parse_dict(coverage)

        return values
