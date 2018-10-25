Feature: Events Ingest
    @auth @events_ingest
    Scenario: Ingest NTB Event file
        Given empty "events"
        When we get "/events"
        Then we get list with 0 items
        When we fetch events from "ntb" ingest "ntb_event_xml"
        When we get "/events"
        Then we get list with 1 items
        """
            {
                "_items": [{
                    "_id": "NTB-123456",
                    "original_creator": "__no_value__"
                }]
            }
        """

    @auth @events_ingest
    Scenario: Duplicate Ingested NTB Event file
        Given empty "events"
        When we get "/events"
        Then we get list with 0 items
        When we fetch events from "ntb" ingest "ntb_event_xml"
        When we get "/events"
        Then we get list with 1 items
        """
            {
                "_items": [{
                    "_id": "NTB-123456",
                    "original_creator": "__no_value__"
                }]
            }
        """
        When we duplicate event "NTB-123456"
        Then  we get OK response
        When we get "/events"
        Then we get list with 2 items
        """
            {
                "_items": [
                    {
                        "_id": "NTB-123456",
                        "original_creator": "__no_value__",
                        "name": "Original Content",
                        "definition_short": "Original Content",
                        "state": "ingested"
                    },
                    {
                        "_id": "#DUPLICATE_EVENT_ID#",
                        "original_creator": "#CONTEXT_USER_ID#",
                        "name": "duplicate",
                        "definition_short": "duplicate",
                        "duplicate_from": "NTB-123456",
                        "state": "draft"
                    }
                ]
            }
        """

    @auth @events_ingest
    Scenario: We reschedule ingested Ingest NTB Event
        Given empty "events"
        When we get "/events"
        Then we get list with 0 items
        When we fetch events from "ntb" ingest "ntb_event_xml"
        When we get "/events"
        Then we get list with 1 items
        """
            {
                "_items": [{
                    "_id": "NTB-123456",
                    "original_creator": "__no_value__",
                    "state": "ingested"
                }]
            }
        """
        When we post to "/events/NTB-123456/lock"
        """
        {"lock_action": "reschedule"}
        """
        Then we get OK response
        When we perform reschedule on events "NTB-123456"
        """
        {
            "reason": "Changed to the next day!",
            "dates": {
                "start": "2029-11-22T12:00:00.000Z",
                "end": "2029-11-22T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 1 items
        """
            {
                "_items": [{
                    "_id": "NTB-123456",
                    "original_creator": "__no_value__",
                    "state": "draft"
                }]
            }
        """