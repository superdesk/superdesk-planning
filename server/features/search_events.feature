Feature: Event Search
    Background: Initial setup
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
                    "recurrence_id": "recur1",
                    "state": "ingested",
                    "ingest_provider": "5923b82f1d41c858e1a5b0ce",
                    "name": "event 123",
                    "slugline": "test1 slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "reference": "2020/00195696",
                    "dates": {
                        "start": "2016-01-02T00:00:00+0000",
                        "end": "2016-01-03T00:00:00+0000"
                    },
                    "subject": [{"qcode": "test qcode 1", "name": "test name"}],
                    "location": [{"qcode": "test qcode", "name": "test name"}],
                    "calendars": [
                        {"qcode": "finance", "name": "finance"},
                        {"qcode": "sports", "name": "sports"}
                    ],
                    "anpa_category": [
                        {"name": "Overseas Sport", "qcode": "s"}
                    ]
                },
                {
                    "guid": "event_456",
                    "unique_id": "456",
                    "unique_name": "name",
                    "state": "draft",
                    "name": "event 456",
                    "slugline": "test2 slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "reference": "2020/00195697",
                    "dates": {
                        "start": "2016-01-02T00:00:00+0000",
                        "end": "2016-01-03T00:00:00+0000"
                    },
                    "subject": [{"qcode": "test qcode 2", "name": "test name"}],
                    "location": [{"qcode": "test qcode", "name": "test name"}],
                    "calendars": [
                        {"qcode": "entertainment", "name": "entertainment"}
                    ],
                    "anpa_category": [
                        {"name": "International News", "qcode": "i"}
                    ],
                    "place": [
                        {
                            "group": "Rest Of World",
                            "name": "ASIA",
                            "state": "",
                            "qcode": "ASIA",
                            "world_region": "Asia",
                            "country": ""
                        }
                    ]
                },
                {
                    "guid": "event_786",
                    "unique_id": "786",
                    "unique_name": "name",
                    "name": "event 786",
                    "state": "published",
                    "pubstatus": "usable",
                    "slugline": "test3 slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "reference": "2020/00195698",
                    "language": "en",
                    "dates": {
                        "start": "2016-01-02T00:00:00+0000",
                        "end": "2016-01-03T00:00:00+0000"
                    },
                    "subject": [{"qcode": "test qcode 2", "name": "test name"}],
                    "lock_session": "ident1"
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
            }
        ]
        """

    @auth
    Scenario: Only retrieve events when using repo=events
        When we get "/events_planning_search?repo=events"
        Then we get list with 0 items
        When we get "/events_planning_search?repo=events&only_future=false"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "event_123"},
            {"_id": "event_456"},
            {"_id": "event_786"}
        ]}
        """

    @auth
    Scenario: Search by common parameters
        When we get "/events_planning_search?repo=events&only_future=false&item_ids=event_123,event_786"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event_123"},
            {"_id": "event_786"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&name=event%20786"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_786"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&full_text=test2"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_456"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&anpa_category=s,i"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event_123"},
            {"_id": "event_456"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&subject=test%20qcode%202"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event_456"},
            {"_id": "event_786"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&posted=true"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_786"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&place=ASIA"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_456"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&language=en"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_786"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=locked"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_786"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=unlocked"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event_123"},
            {"_id": "event_456"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&recurrence_id=recur1"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_123"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&state=draft,ingested"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event_123"},
            {"_id": "event_456"}
        ]}
        """

    @auth
    Scenario: Search by event specific parameters
        When we get "/events_planning_search?repo=events&only_future=false&slugline=test1%20OR%20test2"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event_123"},
            {"_id": "event_456"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&reference=2020%2F00195696"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_123"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&source=5923b82f1d41c858e1a5b0ce"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_123"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&location=test%20qcode"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event_123"},
            {"_id": "event_456"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&calendars=finance,entertainment"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event_123"},
            {"_id": "event_456"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&no_calendar_assigned=true"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event_786"}
        ]}
        """
