from datetime import datetime, timedelta

import pytz

from planning.search.queries.elastic import ElasticRangeParams, field_range, range_today


def _get_all_day_range(query):
    """Extract the range params used for `dates.all_day: True` items from a `dates.start` query."""

    should_clauses = query["bool"]["should"]
    for clause in should_clauses:
        must = clause["bool"]["must"]
        if {"term": {"dates.all_day": True}} in must:
            for item in must:
                if "range" in item:
                    return item["range"]["dates.start"]
    raise AssertionError("Could not find all_day range clause")


def test_field_range_resolves_today_to_local_date_for_all_day_items():
    """Regression test: relative date filters (e.g. "Today") must be resolved to a plain
    local calendar date (and drop `time_zone`) for all-day items. All-day items are stored
    as a literal date, so comparing them against a timezone-aware UTC instant boundary
    can exclude/include the wrong day depending on the time of day and the newsroom's UTC
    offset (e.g. Toronto, UTC-4/5).
    """

    tz = pytz.timezone("America/Toronto")
    now = datetime.now(tz)
    today = now.strftime("%Y-%m-%d")
    tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    query = range_today(ElasticRangeParams(field="dates.start", time_zone="America/Toronto"))

    all_day_range = _get_all_day_range(query)

    assert "time_zone" not in all_day_range
    assert all_day_range["gte"] == today
    assert all_day_range["lt"] == tomorrow


def test_field_range_converts_explicit_datetime_to_local_date():
    """Explicit UTC datetime values should still be converted to a local date-only
    value for all-day items, without the (now unnecessary) `time_zone` param.
    """

    query = field_range(
        ElasticRangeParams(
            field="dates.start",
            time_zone="America/Toronto",
            value_format="date_optional_time",
            gte="2026-08-25T00:00:00+0000",
            lt="2026-08-26T00:00:00+0000",
        )
    )

    all_day_range = _get_all_day_range(query)

    assert "time_zone" not in all_day_range
    assert all_day_range["gte"] == "2026-08-24"
    assert all_day_range["lt"] == "2026-08-25"
