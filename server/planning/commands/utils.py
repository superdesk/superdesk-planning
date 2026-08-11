from typing import Literal, AsyncGenerator
from datetime import datetime

from superdesk.core import get_config
from superdesk.core.utils import date_to_str
from planning.search.queries import elastic
from planning.types.unified import UnifiedPlanningResource


async def iterate_expired_items(
    resource_type: Literal["event", "planning"],
    expiry_datetime: datetime,
    base_query: dict | None = None,
    projection: list[str] | None = None,
) -> AsyncGenerator[list[dict], None]:
    if projection is not None and "_updated" not in projection:
        projection.append("_updated")

    resource_service = UnifiedPlanningResource.get_service()

    query = elastic.ElasticQuery()
    query.sort = [{"_updated": "asc"}]
    query.size = get_config(int, "MAX_EXPIRY_QUERY_LIMIT")
    query.extend_query(base_query or {})

    query.filter.append(elastic.term("type", resource_type))

    if resource_type == "event":
        query.filter.append(
            elastic.field_range(
                elastic.ElasticRangeParams(
                    field="dates.end",
                    lt=date_to_str(expiry_datetime),
                    time_zone="UTC",
                )
            )
        )
    elif resource_type == "planning":
        query.must_not.append(
            elastic.field_range(
                elastic.ElasticRangeParams(
                    field="_planning_schedule.scheduled",
                    gt=date_to_str(expiry_datetime),
                    time_zone="UTC",
                )
            ),
        )
        query.filter.extend(
            [
                elastic.field_range(
                    elastic.ElasticRangeParams(
                        field="dates.start",
                        lt=date_to_str(expiry_datetime),
                        time_zone="UTC",
                    )
                )
            ]
        )

    query_dict = query.build()

    total_received = 0
    total_items = -1
    last_item_query = elastic.date_range(
        elastic.ElasticRangeParams(
            field="_updated",
            gt=date_to_str(expiry_datetime),
            time_zone="UTC",
        )
    )

    for i in range(get_config(int, "MAX_EXPIRY_LOOPS")):
        results = await resource_service.search(query_dict, projection=projection)
        items = await results.to_list_raw()
        results_count = len(items)

        # If the total_items has not been set, then this is the first query
        # In which case we need to store the total hits from the search
        if total_items < 0:
            total_items = results_count

        # If the last query doesn't contain any results, return here
        if results_count == 0:
            break

        total_received += results_count

        # Yield the results for iteration by the callee
        yield items
        last_item_query["range"]["_updated"]["gt"] = items[-1]["_updated"]

        if i == 0:
            query_dict["query"]["bool"].setdefault("must", []).append(last_item_query)
