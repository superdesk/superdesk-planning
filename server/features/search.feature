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
                "slugline": "test slugline",
                "planning_date": "2016-01-02"
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
                "slugline": "test slugline",
                "planning_date": "2016-01-02"
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

    @auth
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
        When we get "/events_planning_search?subject=111&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 1 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"}
            ]
        }
        """


    @auth @wip
    Scenario: Search events and planning using calendars and agenda
        Given "agenda"
        """
            [
                {"name": "sports", "_id": "sports", "is_enabled": true},
                {"name": "finance", "_id": "finance", "is_enabled": true},
                {"name": "entertainment", "_id": "entertainment", "is_enabled": true}
            ]
        """
        And "events"
            """
            [
                {
                    "guid": "event_123",
                    "unique_id": "123",
                    "unique_name": "name",
                    "name": "event 123",
                    "slugline": "test slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "dates": {
                        "start": "2016-01-02T00:00:00+0000",
                        "end": "2016-01-03T00:00:00+0000"
                    },
                    "subject": [{"qcode": "test qcode", "name": "test name"}],
                    "location": [{"qcode": "test qcode", "name": "test name"}],
                    "calendars": [
                        {"qcode": "finance", "name": "finance"},
                        {"qcode": "sports", "name": "sports"}
                    ]
                },
                {
                    "guid": "event_456",
                    "unique_id": "456",
                    "unique_name": "name",
                    "name": "event 456",
                    "slugline": "test slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "dates": {
                        "start": "2016-01-02T00:00:00+0000",
                        "end": "2016-01-03T00:00:00+0000"
                    },
                    "subject": [{"qcode": "test qcode", "name": "test name"}],
                    "location": [{"qcode": "test qcode", "name": "test name"}],
                    "calendars": [
                        {"qcode": "entertainment", "name": "entertainment"}
                    ]
                },
                {
                    "guid": "event_786",
                    "unique_id": "786",
                    "unique_name": "name",
                    "name": "event 786",
                    "slugline": "test slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "dates": {
                        "start": "2016-01-02T00:00:00+0000",
                        "end": "2016-01-03T00:00:00+0000"
                    },
                    "subject": [{"qcode": "test qcode", "name": "test name"}],
                    "location": [{"qcode": "test qcode", "name": "test name"}],
                    "calendars": [
                        {"qcode": "sports", "name": "sports"}
                    ]
                }
            ]
            """
        And "planning"
        """
        [
            {
                "guid": "planning_1",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug123",
                "planning_date": "2016-01-02T12:00:00+0000",
                "agendas": ["sports"]
            },
            {
                "guid": "planning_2",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug123",
                "event_item": "event_123",
                "planning_date": "2016-01-02T13:00:00+0000",
                "agendas": ["sports"]
            },
            {
                "guid": "planning_3",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "event_item": "event_456",
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["finance"]
            },
            {
                "guid": "planning_4",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "event_item": "event_456",
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["entertainment"]
            },
            {
                "guid": "planning_5",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "event_item": "event_786",
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["sports", "finance"]
            },
            {
                "guid": "planning_6",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["entertainment"]
            }
        ]
        """
        When we get "/events_planning_search?start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 5 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "planning_1", "type": "planning"},
                {"_id": "event_456", "type": "event"},
                {"_id": "event_786", "type": "event"},
                {"_id": "planning_6", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?calendars=sports&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "event_786", "type": "event"}
            ]
        }
        """
        When we get "/events_planning_search?agendas=sports&calendars=sports&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 3 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "event_786", "type": "event"},
                {"_id": "planning_1", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?agendas=sports&calendars=sports,finance&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 3 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "event_786", "type": "event"},
                {"_id": "planning_1", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?agendas=sports,finance&calendars=sports,finance&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 4 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "event_456", "type": "event"},
                {"_id": "event_786", "type": "event"},
                {"_id": "planning_1", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?agendas=entertainment&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "event_456", "type": "event"},
                {"_id": "planning_6", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?agendas=sports&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 3 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "event_786", "type": "event"},
                {"_id": "planning_1", "type": "planning"}
            ]
        }
        """

    @auth
    Scenario: Search events and planning using reference
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
                    "reference": "2020/00195696",
                    "dates": {
                        "start": "2016-01-02T00:00:00+0000",
                        "end": "2016-01-03T00:00:00+0000"
                    }
                },
                {
                    "guid": "event_456",
                    "unique_id": "456",
                    "unique_name": "name 2",
                    "name": "event 2",
                    "slugline": "test2 slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "reference": "2020/00195697",
                    "dates": {
                        "start": "2016-01-02T00:00:00+0000",
                        "end": "2016-01-03T00:00:00+0000"
                    }
                }
            ]
            """
        When we get "/events_planning_search?full_text=&max_results=50&page=1&reference=2020%2F00195696&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 1 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"}
            ]
        }
        """
