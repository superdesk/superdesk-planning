Feature: Search Events and Planning
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
    Scenario: Can use projections
        When we get "/events_planning_search?only_future=false&projections=["_id"]"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "event_123", "type": "event", "name": "__no_value__"},
            {"_id": "event_456", "type": "event", "name": "__no_value__"},
            {"_id": "event_786", "type": "event", "name": "__no_value__"},
            {"_id": "planning_1", "type": "planning", "slugline": "__no_value__"}
        ]}
        """

    @auth
    Scenario: Users can only see their events without the planning_global_filters privilege
        Given "events"
        """
        [{
            "guid": "user_1_event_1",
            "name": "event1 for user 1",
            "dates": {"start": "2016-01-02T00:00:00+0000", "end": "2016-01-03T00:00:00+0000"},
            "original_creator": "user_1"
        }, {
            "guid": "user_1_event_2",
            "name": "event2 for user 1",
            "dates": {"start": "2016-01-02T00:00:00+0000", "end": "2016-01-03T00:00:00+0000"},
            "original_creator": "user_1"
        }, {
            "guid": "user_2_event_1",
            "name": "event1 for user 2",
            "dates": {"start": "2016-01-02T00:00:00+0000", "end": "2016-01-03T00:00:00+0000"},
            "original_creator": "#CONTEXT_USER_ID#"
        }, {
            "guid": "user_2_event_2",
            "name": "event2 for user 2",
            "dates": {"start": "2016-01-02T00:00:00+0000", "end": "2016-01-03T00:00:00+0000"},
            "original_creator": "#CONTEXT_USER_ID#"
        }]
        """
        And "planning"
        """
        [{
            "guid": "user_1_plan_1",
            "headline": "plan1 for user 1",
            "planning_date": "2016-01-01T12:00:00+0000",
            "original_creator": "user_1",
            "event_item": "user_1_event_1"
        }, {
            "guid": "user_1_plan_2",
            "headline": "plan2 for user 1",
            "planning_date": "2016-01-01T12:00:00+0000",
            "original_creator": "user_1"
        }, {
            "guid": "user_2_plan_1",
            "headline": "plan1 for user 2",
            "planning_date": "2016-01-01T12:00:00+0000",
            "original_creator": "#CONTEXT_USER_ID#",
            "event_item": "user_2_event_2"
        }, {
            "guid": "user_2_plan_2",
            "headline": "plan2 for user 2",
            "planning_date": "2016-01-01T12:00:00+0000",
            "original_creator": "#CONTEXT_USER_ID#"
        }]
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_global_filters": 0, "users": 1}}
        """
        Then we get OK response
        When we get "/events_planning_search?only_future=false"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "user_2_event_1"},
            {"_id": "user_2_event_2"},
            {"_id": "user_2_plan_2"}
        ]}
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_global_filters": 1, "users": 1}}
        """
        Then we get OK response
        When we get "/events_planning_search?only_future=false"
        Then we get list with 6 items
        """
        {"_items": [
            {"_id": "user_1_event_1"},
            {"_id": "user_1_event_2"},
            {"_id": "user_2_event_1"},
            {"_id": "user_2_event_2"},
            {"_id": "user_1_plan_2"},
            {"_id": "user_2_plan_2"}
        ]}
        """
