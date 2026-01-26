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
