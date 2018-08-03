Feature: Search Feature

    @auth
    Scenario: Can search events
        Given "events"
            """
            [
                {
                    "guid": "123",
                    "unique_id": "123",
                    "unique_name": "123 name",
                    "name": "event 123",
                    "slugline": "event-123",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "dates": {
                        "start": "2016-01-02",
                        "end": "2016-01-03"
                    },
                    "subject": [{"qcode": "test qcaode", "name": "test name"}],
                    "location": [{"qcode": "test qcaode", "name": "test name"}]
                }
            ]
            """
        When we get "/planning_search"
        Then we get list with 1 items

    @auth
    Scenario: Can search planning
        Given "planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        When we get "/planning_search"
        Then we get list with 1 items

    @auth
    Scenario: Can search planning and events
        Given "planning"
        """
        [
            {
                "guid": "planning_123",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        And "events"
            """
            [
                {
                    "guid": "event_123",
                    "unique_id": "123",
                    "unique_name": "123 name",
                    "name": "event 123",
                    "slugline": "test slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "dates": {
                        "start": "2016-01-02",
                        "end": "2016-01-03"
                    },
                    "subject": [{"qcode": "test qcaode", "name": "test name"}],
                    "location": [{"qcode": "test qcaode", "name": "test name"}]
                }
            ]
            """
        When we get "/planning_search"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "planning_123", "type": "planning"},
                {"_id": "event_123", "type": "event"}
            ]
        }
        """
        When we get "/planning_search?source=%7B%22query%22%3A%7B%22bool%22%3A%7B%22must%22%3A%5B%7B%22query_string%22%3A%7B%22query%22%3A%22slugline%3Aslugline%22%7D%7D%5D%7D%7D%7D"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "planning_123", "type": "planning"},
                {"_id": "event_123", "type": "event"}
            ]
        }
        """
        When we get "/planning_search?source=%7B%22query%22%3A%7B%22bool%22%3A%7B%22must%22%3A%5B%7B%22query_string%22%3A%7B%22query%22%3A%22headline%3Atest%22%7D%7D%5D%7D%7D%7D"
        Then we get list with 1 items
        """
        {
            "_items": [
                {"_id": "planning_123", "type": "planning"}
            ]
        }
        """

    @auth @wip
    Scenario: Search events and planning using slugline, subject
        Given "events"
            """
            [
                {
                    "guid": "event_123",
                    "unique_id": "123",
                    "unique_name": "name",
                    "name": "event",
                    "slugline": "test slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "dates": {
                        "start": "2016-01-02T00:00:00+0000",
                        "end": "2016-01-03T00:00:00+0000"
                    },
                    "subject": [{"qcode": "test qcaode", "name": "test name"}],
                    "location": [{"qcode": "test qcaode", "name": "test name"}]
                }
            ]
            """
        And "planning"
        """
        [
            {
                "guid": "planning_123",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug123",
                "planning_date": "2016-01-02T12:00:00+0000"
            },
            {
                "guid": "planning_456",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug123",
                "event_item": "event_123",
                "planning_date": "2016-01-02T13:00:00+0000"
            },
            {
                "guid": "planning_789",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "event_item": "event_123",
                "subject": [{"qcode": "111", "name": "test name"}],
                "planning_date": "2016-01-02T14:00:00+0000"
            }
        ]
        """
        When we get "/events_planning_search?start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "planning_123", "type": "planning"},
                {"_id": "event_123", "type": "event"}
            ]
        }
        """
        When we get "/events_planning_search?slugline=slug123&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "planning_123", "type": "planning"},
                {"_id": "event_123", "type": "event"}
            ]
        }
        """
        When we get "/events_planning_search?subject=%5B%22111%22%5D&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 1 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"}
            ]
        }
        """