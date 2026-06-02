from functools import partial

from quart_babel import gettext

from superdesk.core import json
from superdesk.errors import SuperdeskApiError
from planning.search.queries import elastic, events, planning, common


def set_base_query(params: dict, query: elastic.ElasticQuery) -> None:
    if not len(params.get("query") or ""):
        return

    try:
        query_param = json.loads(params["query"])
    except ValueError as e:
        raise SuperdeskApiError.badRequestError(gettext(f"Invalid query param: {e}")) from e

    # If the client provided a base query, add that as a separate must clause
    query.must.append({"bool": query_param})


def search_multiple_content(params: dict, query: elastic.ElasticQuery) -> None:
    if "multiple_content" not in params:
        return
    elif common.strtobool(params.get("multiple_content") or False):
        query.must.append(
            elastic.term(
                field="planning.multiple_content",
                value=True,
            )
        )
    else:
        query.must_not.append(
            elastic.term(
                field="planning.multiple_content",
                value=True,
            )
        )


def search_desks(params: dict, query: elastic.ElasticQuery) -> None:
    desk_ids = common.str_to_array(params.get("desk_ids"))

    if len(desk_ids):
        query.must.append(
            elastic.terms(
                field="assigned_to.desk",
                values=desk_ids,
            )
        )


def search_users(params: dict, query: elastic.ElasticQuery) -> None:
    user_ids = common.str_to_array(params.get("user_ids"))

    if len(user_ids):
        query.must.append(
            elastic.terms(
                field="assigned_to.user",
                values=user_ids,
            )
        )


def search_states(params: dict, query: elastic.ElasticQuery) -> None:
    states = common.str_to_array(params.get("states"))

    if len(states):
        query.must.append(
            elastic.terms(
                field="assigned_to.state",
                values=states,
            )
        )


def search_g2_content_types(params: dict, query: elastic.ElasticQuery) -> None:
    g2_content_type = common.str_to_array(params.get("g2_content_type") or "")

    if len(g2_content_type):
        query.must.append(
            elastic.terms(
                field="planning.g2_content_type",
                values=g2_content_type,
            )
        )


def search_priority(params: dict, query: elastic.ElasticQuery) -> None:
    priorities = [str(qcode) for qcode in common.str_to_array(params.get("priority"))]

    if len(priorities):
        query.must.append(
            elastic.terms(
                field="planning.priority",
                values=priorities,
            )
        )


def search_full_text(params: dict, query: elastic.ElasticQuery) -> None:
    text_search = params.get("search_query") or ""

    if len(text_search):
        query.must.append(elastic.query_string(text=text_search, lenient=True, default_operator="AND"))


def search_date_filter(params: dict, query: elastic.ElasticQuery) -> None:
    # Update the date filter params to match what's supplied from front-end
    date_filter, start_date, end_date, time_zone = common.get_date_params(params)

    if not date_filter and (start_date or end_date):
        range_params = elastic.ElasticRangeParams(field="planning.scheduled", time_zone=time_zone)
        if start_date:
            range_params.gte = start_date
        if end_date:
            range_params.lte = end_date

        query.filter.append(elastic.field_range(range_params))
    elif date_filter == "today":
        query.must.append(
            elastic.field_range(
                elastic.ElasticRangeParams(
                    field="planning.scheduled",
                    gte="now/d",
                    lte="now/d",
                    time_zone=time_zone,
                )
            )
        )
    elif date_filter == "current":
        query.must.append(
            elastic.field_range(
                elastic.ElasticRangeParams(
                    field="planning.scheduled",
                    lte="now/d",
                    time_zone=time_zone,
                )
            )
        )
    elif date_filter == "future":
        query.must.append(
            elastic.field_range(
                elastic.ElasticRangeParams(
                    field="planning.scheduled",
                    gt="now/d",
                    time_zone=time_zone,
                )
            )
        )


def search_ignore_scheduled_updates(params: dict, query: elastic.ElasticQuery) -> None:
    if common.strtobool(params.get("ignore_scheduled_updates") or False):
        query.must_not.append(elastic.field_exists("scheduled_update_id"))


def search_slugline(params: dict, query: elastic.ElasticQuery) -> None:
    slugline = params.get("slugline") or ""
    search_field = "planning.slugline"
    if slugline.startswith('"') and slugline.endswith('"'):
        search_field = "planning.slugline.phrase"
        slugline = slugline[1:-1]

    if not len(slugline):
        return

    params["slugline"] = slugline
    common.search_text_field(params, query, "slugline", search_field)


def set_search_sort(params: dict, query: elastic.ElasticQuery) -> None:
    field = common.get_sort_field(params, "schedule")
    order = common.get_sort_order(params, "ascending")

    if field == "schedule":
        field = "planning.scheduled"
    elif field == "firstcreated":
        field = "_created"
    elif field == "versioncreated":
        field = "_updated"

    query.sort.append({field: {"order": order}})


def search_custom_text(params: dict, query: elastic.ElasticQuery) -> None:
    custom_text = common.str_to_array(params.get("custom_text") or "")
    if not len(custom_text):
        return

    text_by_scheme: dict[str, str] = {}
    for text in custom_text:
        if ":" not in text:
            raise SuperdeskApiError.badRequestError(gettext("Invalid custom text param"))

        field, value = text.split(":", 1)
        text_by_scheme[field] = value

    for field, value in text_by_scheme.items():
        query.must.append(
            elastic.nested(
                "planning.fields",
                {
                    "bool": {
                        "must": [
                            elastic.term(field="planning.fields.field", value=field),
                            elastic.query_string(
                                text=value,
                                field="planning.fields.value",
                                default_operator="AND",
                                lenient=True,
                            ),
                        ]
                    }
                },
            )
        )


def search_genre(params: dict, query: elastic.ElasticQuery) -> None:
    genres = common.str_to_array(params.get("genre") or "")
    if len(genres):
        query.must.append(elastic.terms(field="planning.genre.qcode", values=genres))


def search_assignment_priority(params: dict, query: elastic.ElasticQuery) -> None:
    priorities = common.str_to_array(params.get("assignment_priority") or "")
    if len(priorities):
        query.must.append(elastic.terms(field="priority", values=priorities))


ASSIGNMENTS_SEARCH_FILTERS: list[common.FilterFunctionType] = [
    set_base_query,
    set_search_sort,
    search_date_filter,
    search_multiple_content,
    search_desks,
    search_users,
    search_states,
    search_g2_content_types,
    search_priority,
    search_full_text,
    search_slugline,
    search_custom_text,
    search_genre,
    search_assignment_priority,
    search_ignore_scheduled_updates,
    partial(common.search_subject, field_prefix="planning"),
    partial(common.search_anpa_category, field_prefix="planning"),
    partial(common.search_language, field_prefix="planning", include_multi=False),
]

ASSIGNMENTS_PARAMS: list[str] = [
    # Base query & pagination
    "repo",
    "query",
    "max_results",
    "page",
    "projections",
    "sort_order",
    "sort_field",
    # Assignee/state fields
    "desk_ids",
    "user_ids",
    "states",
    "g2_content_type",
    "assignment_priority",
    "ignore_scheduled_updates",
    "multiple_content",
    # Metadata fields
    "priority",
    "search_query",
    "slugline",
    "custom_text",
    "genre",
    "subject",
    "anpa_category",
    "language",
    # Date filters
    "date_filter",
    "time_zone",
    "start_date",
    "end_date",
]
