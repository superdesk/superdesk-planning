from typing import Set, Dict, Any
from datetime import timedelta

from flask import current_app as app

from superdesk.utc import utcnow
from apps.archive.autocomplete import (
    SETTING_LIMIT as AUTOCOMPLETE_LIMIT,
    SETTING_DAYS as AUTOCOMPLETE_DAYS,
    SETTING_HOURS as AUTOCOMPLETE_HOURS,
    register_autocomplete_suggestion_provider,
)

from planning.common import WORKFLOW_STATE, POST_STATE


def get_planning_suggestions(field: str, language: str) -> Set[str]:
    bool_query = _construct_bool_query(language)
    bool_query["should"].append(
        {
            "nested": {
                "path": "coverages",
                "query": {"bool": {"must": [{"term": {"coverages.planning.language": language}}]}},
            },
        }
    )

    aggs_query = _construct_aggs_query(field, language)
    coverage_field_mapping = {"slugline": "coverages.planning.slugline.keyword"}
    coverage_field = coverage_field_mapping.get(field) or f"coverages.planning.{field}"

    aggs_query["coverages"] = {
        "nested": {"path": "coverages"},
        "aggs": {
            "coverages_filtered": {
                "filter": {"bool": {"must": [{"term": {"coverages.planning.language": language}}]}},
                "aggs": {"coverage_suggestions": agg_field_suggestion(coverage_field)},
            },
        },
    }

    query = {
        "query": {"bool": bool_query},
        "aggs": aggs_query,
    }

    res = app.data.elastic.search(query, "planning", params={"size": 0})
    suggestions = _get_aggregation_values(res.hits["aggregations"])

    return suggestions


def get_event_suggestions(field: str, language: str) -> Set[str]:
    query = {
        "query": {"bool": _construct_bool_query(language)},
        "aggs": _construct_aggs_query(field, language),
    }

    res = app.data.elastic.search(query, "events", params={"size": 0})
    return _get_aggregation_values(res.hits["aggregations"])


def _get_aggregation_values(aggregations) -> Set[str]:
    suggestions = set()

    try:
        base_suggestions = set(
            [bucket["key"] for bucket in aggregations["base_field_filtered"]["base_field"]["buckets"]]
        )
        suggestions = base_suggestions
    except KeyError:
        pass

    try:
        translated_suggestions = set(
            [
                bucket["key"]
                for bucket in aggregations["translations"]["languages_filtered"]["field_languages"]["buckets"]
            ]
        )
        suggestions = suggestions.union(translated_suggestions)
    except KeyError:
        pass

    try:
        coverage_suggestions = set(
            [
                bucket["key"]
                for bucket in aggregations["coverages"]["coverages_filtered"]["coverage_suggestions"]["buckets"]
            ]
        )
        suggestions = suggestions.union(coverage_suggestions)
    except KeyError:
        pass

    return suggestions


def agg_field_suggestion(field):
    return {
        "terms": {
            "field": field,
            "size": app.config[AUTOCOMPLETE_LIMIT],
            "order": {"_key": "asc"},
        },
    }


def _construct_bool_query(language: str) -> Dict[str, Any]:
    versioncreated_min = (
        utcnow() - timedelta(days=app.config[AUTOCOMPLETE_DAYS], hours=app.config[AUTOCOMPLETE_HOURS])
    ).replace(
        microsecond=0
    )  # avoid different microsecond each time so elastic has 1s to cache

    return {
        "must": [
            {"term": {"pubstatus": POST_STATE.USABLE}},
            {"terms": {"state": [WORKFLOW_STATE.SCHEDULED, WORKFLOW_STATE.POSTPONED, WORKFLOW_STATE.RESCHEDULED]}},
            {"range": {"versioncreated": {"gte": versioncreated_min}}},
        ],
        "should": [
            {"term": {"language": language}},
            {"term": {"languages": language}},
        ],
        "minimum_should_match": 1,
    }


def _construct_aggs_query(field: str, language: str) -> Dict[str, Any]:
    field_mapping = {"slugline": "slugline.keyword"}
    base_field = field_mapping.get(field) or field

    return {
        "base_field_filtered": {
            "filter": {
                "bool": {
                    "must_not": [
                        {
                            "nested": {
                                "path": "translations",
                                "query": {
                                    "bool": {
                                        "must": [
                                            {"term": {"translations.field": field}},
                                            {"term": {"translations.language": language}},
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            "aggs": {"base_field": agg_field_suggestion(base_field)},
        },
        "translations": {
            "nested": {"path": "translations"},
            "aggs": {
                "languages_filtered": {
                    "filter": {
                        "bool": {
                            "must": [
                                {"term": {"translations.field": field}},
                                {"term": {"translations.language": language}},
                            ],
                        },
                    },
                    "aggs": {"field_languages": agg_field_suggestion("translations.value.keyword")},
                },
            },
        },
    }


def init_app(_app):
    register_autocomplete_suggestion_provider("planning", get_planning_suggestions)
    register_autocomplete_suggestion_provider("events", get_event_suggestions)
