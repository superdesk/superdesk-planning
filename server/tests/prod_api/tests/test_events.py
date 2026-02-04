import json
from flask import url_for

from superdesk import get_resource_service


def test_service_get(prodapi_app_with_data):
    """Test fetching items using `events` service

    :param prodapi_app_with_data: prod api app with filled data
    """

    with prodapi_app_with_data.app_context():
        items_service = get_resource_service("events")

        assert len(list(items_service.get(req=None, lookup={}))) == 7


def test_readonly(prodapi_app_with_data, prodapi_app_with_data_client):
    """Ensure that `events` endpoint is readonly

    :param prodapi_app_with_data: prod api app with filled data
    :param prodapi_app_with_data_client: client for prod api app with filled data
    """

    with prodapi_app_with_data.test_request_context():
        for method, status in (
            ("get", 200),
            ("post", 405),
            ("patch", 405),
            ("put", 405),
            ("delete", 405),
        ):
            # we send a request
            resp = getattr(prodapi_app_with_data_client, method)(url_for("events|resource"))
            # we get a response
            assert resp.status_code == status


def test_excluded_fields(prodapi_app_with_data, prodapi_app_with_data_client):
    """Ensure that fields which are listed as `excluded_fields` are not in the response.

    :param prodapi_app_with_data: prod api app with filled data
    :param prodapi_app_with_data_client: client for prod api app with filled data
    """

    excluded_fields = {
        "lock_action",
        "lock_user",
        "lock_time",
        "lock_session",
        "_etag",
        "_type",
        "_updated",
        "_created",
        "_current_version",
    }

    with prodapi_app_with_data.test_request_context():
        # list
        resp = prodapi_app_with_data_client.get(url_for("events|resource"))
        resp_data = json.loads(resp.data.decode("utf-8"))

        for item in resp_data["_items"]:
            assert len(set(item.keys()) & excluded_fields) == 0

        # details
        item = resp_data["_items"][0]
        resp = prodapi_app_with_data_client.get(
            url_for("events|item_lookup", _id=item["guid"]),
        )
        resp_data = json.loads(resp.data.decode("utf-8"))

        assert len(set(resp_data.keys()) & excluded_fields) == 0


def test_filter_by_planning_search(prodapi_app_with_data, prodapi_app_with_data_client):
    """Test filtering events by planning items using planning_source parameter with Elasticsearch query.

    Note: The query must use analyzed field queries (match, query_string) not term queries
    because planning fields like 'slugline' are analyzed during indexing.
    """
    target_event_id = "urn:newsml:localhost:5000:2019-09-10T16:22:34.066960:6b2d9c79-08b9-456f-b890-9b2154ee997a"

    with prodapi_app_with_data.test_request_context():
        # Use match query for analyzed fields like slugline
        elastic_query = {"query": {"match": {"slugline": "PLAN B"}}}
        resp = prodapi_app_with_data_client.get(
            url_for("events|resource", planning_source=json.dumps(elastic_query)),
        )
        resp_data = json.loads(resp.data.decode("utf-8"))

        assert resp.status_code == 200
        assert len(resp_data["_items"]) == 1
        assert resp_data["_items"][0]["guid"] == target_event_id


def test_filter_events_by_source_and_planning_source(prodapi_app_with_data, prodapi_app_with_data_client):
    """Test combining event search via source param with planning filtering via planning_source param

    :param prodapi_app_with_data: prod api app with filled data
    :param prodapi_app_with_data_client: client for prod api app with filled data
    """

    target_event_id = "urn:newsml:localhost:5000:2019-09-10T16:22:34.066960:6b2d9c79-08b9-456f-b890-9b2154ee997a"

    with prodapi_app_with_data.test_request_context():
        # Search for events matching "EVENT" in slugline AND filter to planning items with "PLAN B"
        event_source = {"query": {"query_string": {"query": "EVENT", "default_field": "slugline"}}}
        planning_source = {"query": {"match": {"slugline": "PLAN B"}}}

        resp = prodapi_app_with_data_client.get(
            url_for(
                "events|resource",
                source=json.dumps(event_source),
                planning_source=json.dumps(planning_source),
            ),
        )
        resp_data = json.loads(resp.data.decode("utf-8"))

        assert resp.status_code == 200
        assert len(resp_data["_items"]) == 1
        assert resp_data["_items"][0]["guid"] == target_event_id


def test_planning_source_invalid_json(prodapi_app_with_data, prodapi_app_with_data_client):
    """Test that invalid JSON in planning_source parameter returns 400 error

    :param prodapi_app_with_data: prod api app with filled data
    :param prodapi_app_with_data_client: client for prod api app with filled data
    """

    with prodapi_app_with_data.test_request_context():
        # Pass invalid JSON as planning_source
        resp = prodapi_app_with_data_client.get(
            url_for("events|resource", planning_source="not valid json"),
        )

        assert resp.status_code == 400


def test_planning_source_no_matches(prodapi_app_with_data, prodapi_app_with_data_client):
    """Test that planning_source matching no items returns empty results

    :param prodapi_app_with_data: prod api app with filled data
    :param prodapi_app_with_data_client: client for prod api app with filled data
    """

    with prodapi_app_with_data.test_request_context():
        # Query for planning items that don't exist
        elastic_query = {"query": {"match": {"slugline": "NONEXISTENT_PLANNING"}}}
        resp = prodapi_app_with_data_client.get(
            url_for("events|resource", planning_source=json.dumps(elastic_query)),
        )
        resp_data = json.loads(resp.data.decode("utf-8"))

        assert resp.status_code == 200
        assert len(resp_data["_items"]) == 0


def test_planning_items_without_event_item(prodapi_app_with_data, prodapi_app_with_data_client):
    """Test that planning items without event_item field are skipped

    When planning items match the query but have no event_item field,
    they should be ignored (not cause errors).

    :param prodapi_app_with_data: prod api app with filled data
    :param prodapi_app_with_data_client: client for prod api app with filled data
    """

    with prodapi_app_with_data.test_request_context():
        # Query for "test planning item" which exists but may not have event_item
        elastic_query = {"query": {"match": {"slugline": "test"}}}
        resp = prodapi_app_with_data_client.get(
            url_for("events|resource", planning_source=json.dumps(elastic_query)),
        )
        resp_data = json.loads(resp.data.decode("utf-8"))

        # Should not error, just return whatever matches
        assert resp.status_code == 200


def test_event_source_without_planning_source(prodapi_app_with_data, prodapi_app_with_data_client):
    """Test that event source filtering works independently without planning_source

    :param prodapi_app_with_data: prod api app with filled data
    :param prodapi_app_with_data_client: client for prod api app with filled data
    """

    with prodapi_app_with_data.test_request_context():
        # Use only source parameter, no planning_source
        event_source = {"query": {"query_string": {"query": "EVENT A", "default_field": "slugline"}}}
        resp = prodapi_app_with_data_client.get(
            url_for("events|resource", source=json.dumps(event_source)),
        )
        resp_data = json.loads(resp.data.decode("utf-8"))

        assert resp.status_code == 200
        # Should return event matching the source query
        assert len(resp_data["_items"]) >= 1
        for item in resp_data["_items"]:
            assert "EVENT A" in item.get("slugline", "")


def test_planning_source_alone_filters_correctly(prodapi_app_with_data, prodapi_app_with_data_client):
    """Test that planning_source alone (without source parameter) filters events correctly

    :param prodapi_app_with_data: prod api app with filled data
    :param prodapi_app_with_data_client: client for prod api app with filled data
    """

    target_event_id = "urn:newsml:localhost:5000:2019-09-10T16:22:34.066960:6b2d9c79-08b9-456f-b890-9b2154ee997a"

    with prodapi_app_with_data.test_request_context():
        # Use only planning_source, no event source parameter
        planning_source = {"query": {"match": {"slugline": "PLAN B"}}}
        resp = prodapi_app_with_data_client.get(
            url_for("events|resource", planning_source=json.dumps(planning_source)),
        )
        resp_data = json.loads(resp.data.decode("utf-8"))

        assert resp.status_code == 200
        assert len(resp_data["_items"]) == 1
        assert resp_data["_items"][0]["guid"] == target_event_id


def test_planning_source_malformed_elasticsearch_query(prodapi_app_with_data, prodapi_app_with_data_client):
    """Test that malformed Elasticsearch query in planning_source returns 400 error

    When the planning_source contains a malformed Elasticsearch query that causes
    an Elasticsearch RequestError, it should be caught and returned as a 400 Bad Request
    instead of a 500 Internal Server Error.

    :param prodapi_app_with_data: prod api app with filled data
    :param prodapi_app_with_data_client: client for prod api app with filled data
    """

    with prodapi_app_with_data.test_request_context():
        # Pass a malformed Elasticsearch query (exists query without proper structure)
        # This simulates: [exists] query malformed, no start_object after query name
        malformed_query = {"query": {"exists": "field_name"}}  # Should be {"exists": {"field": "field_name"}}
        resp = prodapi_app_with_data_client.get(
            url_for("events|resource", planning_source=json.dumps(malformed_query)),
        )
        resp_data = json.loads(resp.data.decode("utf-8"))

        assert resp.status_code == 400
        assert "_message" in resp_data
        assert "Invalid planning_source query" in resp_data["_message"]
