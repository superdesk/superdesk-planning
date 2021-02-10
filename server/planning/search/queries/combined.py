from typing import Dict, Any, List

from planning.search.queries import elastic, events, planning, common


def construct_combined_view_data_query(
    params: Dict[str, Any],
    search_filter: Dict[str, Any],
    items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    ids = set()
    for item in items:
        item_id = item.get('_id')
        event_id = item.get('event_item')
        if common.strtobool(params.get('include_associated_planning', False)):
            ids.add(item_id)
            if event_id:
                ids.add(event_id)
        else:
            # Combined search prioritises Events over Planning items
            # therefore if the Planning item is linked to an Event
            # then we want to return that Event instead
            ids.add(event_id or item_id)

    query = elastic.ElasticQuery()

    if len(search_filter['params']):
        search_dates(search_filter['params'], query)

    search_dates(params, query)

    query.must.append(
        elastic.terms(
            field='_id',
            values=list(ids)
        )
    )

    return query.build()


def search_not_common_fields(params: Dict[str, Any], query: elastic.ElasticQuery):
    events.search_reference(params, query)
    planning.search_slugline(params, query)


def search_calendars_and_agendas(params: Dict[str, Any], query: elastic.ElasticQuery):
    or_query = elastic.ElasticQuery()
    events.search_calendars(params, or_query)
    planning.search_agendas(params, or_query)

    if len(or_query.must) == 1:
        query.must.append(or_query.must[0])
    elif len(or_query.must) > 1:
        query.must.append(
            elastic.bool_or(
                or_query.must
            )
        )


def search_dates(params: Dict[str, Any], query: elastic.ElasticQuery):
    if params.get('exclude_dates'):
        return

    event_query = elastic.ElasticQuery()
    events.search_events(params, event_query)
    events.search_dates(params, event_query)

    planning_query = elastic.ElasticQuery()
    planning.search_planning(params, planning_query)
    planning.search_dates(params, planning_query)
    query.sort = planning_query.sort
    planning_query.sort = []

    query.must.append(
        elastic.bool_or([
            event_query.build()['query'],
            planning_query.build()['query']
        ])
    )


COMBINED_SEARCH_FILTERS = [
    search_not_common_fields,
    search_calendars_and_agendas,
    search_dates,
]

COMBINED_SEARCH_FILTERS.extend(common.COMMON_SEARCH_FILTERS)

COMBINED_PARAMS = [
    'reference',
    'slugline',
    'calendars',
    'agendas',
    'include_associated_planning'
]

COMBINED_PARAMS.extend(common.COMMON_PARAMS)
