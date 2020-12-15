from typing import Dict, Any, Set

from planning.search.queries import elastic
from .events import construct_events_search_query, search_dates as search_event_dates
from .planning import construct_planning_search_query, search_dates as search_planning_dates


def construct_combined_view_data_query(params: Dict[str, Any], ids: Set[str]) -> Dict[str, Any]:
    query = elastic.ElasticQuery()

    search_event_dates(params, query)
    search_planning_dates(params, query)

    query.must.append(
        elastic.terms(
            field='_id',
            values=list(ids)
        )
    )

    return query.build()


def construct_combined_search_query(params: Dict[str, Any]) -> Dict[str, Any]:
    query = elastic.ElasticQuery()
    event_query = construct_events_search_query(params)
    planning_query = construct_planning_search_query(params)
    sort = planning_query.pop('sort', None)

    query.must.append(
        elastic.bool_or([
            event_query,
            planning_query
        ])
    )
    query.sort = sort

    return query.build()
