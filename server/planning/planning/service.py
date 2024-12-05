from typing import AsyncGenerator, Any
from datetime import datetime
from superdesk.core.utils import date_to_str

from planning.types import PlanningResourceModel
from planning.common import WORKFLOW_STATE
from planning.core.service import BasePlanningAsyncService


class PlanningAsyncService(BasePlanningAsyncService[PlanningResourceModel]):
    resource_name = "planning"

    async def get_expired_items(
        self, expiry_datetime: datetime, spiked_planning_only: bool = False
    ) -> AsyncGenerator[list[dict[str, Any]], None]:
        """Get the expired items

        Where planning_date is in the past
        """
        nested_filter = {
            "nested": {
                "path": "_planning_schedule",
                "query": {"range": {"_planning_schedule.scheduled": {"gt": date_to_str(expiry_datetime)}}},
            }
        }
        range_filter = {"range": {"planning_date": {"gt": date_to_str(expiry_datetime)}}}
        query: dict[str, Any] = {
            "query": {
                "bool": {
                    "must_not": [
                        {
                            "nested": {
                                "path": "related_events",
                                "query": {"term": {"related_events.link_type": "primary"}},
                            },
                        },
                        {"term": {"expired": True}},
                        nested_filter,
                        range_filter,
                    ]
                }
            }
        }

        if spiked_planning_only:
            query = {
                "query": {
                    "bool": {
                        "must_not": [nested_filter, range_filter],
                        "must": [{"term": {"state": WORKFLOW_STATE.SPIKED}}],
                    }
                }
            }

        query["sort"] = [{"planning_date": "asc"}]
        query["size"] = 200

        total_received = 0
        total_items = -1

        while True:
            query["from"] = total_received

            results = await self.search(query)
            items = await results.to_list_raw()
            results_count = len(items)

            # If the total_items has not been set, then this is the first query
            # In which case we need to store the total hits from the search
            if total_items < 0:
                total_items = results_count

                # If the search doesn't contain any results, return here
                if total_items < 1:
                    break

            # If the last query doesn't contain any results, return here
            if results_count == 0:
                break

            total_received += results_count

            # Yield the results for iteration by the callee
            yield items
