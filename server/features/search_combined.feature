Feature: Search Events and Planning
    Background: Initial setup
        Given "agenda"
        """
        [
            {"name": "sports", "_id": "68e5df45ac0f6c8b678c17b1", "is_enabled": true},
            {"name": "finance", "_id": "68e5df45ac0f6c8b678c17b2", "is_enabled": true},
            {"name": "entertainment", "_id": "68e5df45ac0f6c8b678c17b3", "is_enabled": true}
        ]
        """
        And "events"
            """
            [
                {
                    "guid": "event_123",
                    "unique_id": "123",
                    "unique_name": "name 123",
                    "recurrence_id": "recur1",
                    "state": "ingested",
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
                    "unique_name": "name 456",
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
                    "unique_name": "name 789",
                    "name": "event 786",
                    "state": "active",
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
                    "lock_session": "5f4e7eac8f8b9c001f1e1e01"
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
                "agendas": ["#agenda_0._id#"]
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
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "sign_off": "foob"}]
        """
        And empty "events"
        And empty "planning"
        Given "events"
        """
        [{
            "guid": "user_1_event_1",
            "name": "event1 for user 1",
            "dates": {"start": "2016-01-02T00:00:00+0000", "end": "2016-01-03T00:00:00+0000"},
            "original_creator": "#users._id#"
        }, {
            "guid": "user_1_event_2",
            "name": "event2 for user 1",
            "dates": {"start": "2016-01-02T00:00:00+0000", "end": "2016-01-03T00:00:00+0000"},
            "original_creator": "#users._id#"
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
            "original_creator": "#users._id#",
            "related_events": [{"_id": "user_1_event_1", "link_type": "primary"}]
        }, {
            "guid": "user_1_plan_2",
            "headline": "plan2 for user 1",
            "planning_date": "2016-01-01T12:00:00+0000",
            "original_creator": "#users._id#"
        }, {
            "guid": "user_2_plan_1",
            "headline": "plan1 for user 2",
            "planning_date": "2016-01-01T12:00:00+0000",
            "original_creator": "#CONTEXT_USER_ID#",
            "related_events": [{"_id": "user_2_event_2", "link_type": "primary"}]
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
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "user_2_event_1"},
            {"_id": "user_2_event_2"},
            {"_id": "user_2_plan_1"},
            {"_id": "user_2_plan_2"}
        ]}
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_global_filters": 1, "users": 1}}
        """
        Then we get OK response
        When we get "/events_planning_search?only_future=false"
        Then we get list with 8 items
        """
        {"_items": [
            {"_id": "user_1_event_1"},
            {"_id": "user_1_event_2"},
            {"_id": "user_2_event_1"},
            {"_id": "user_2_event_2"},
            {"_id": "user_1_plan_1"},
            {"_id": "user_1_plan_2"},
            {"_id": "user_2_plan_1"},
            {"_id": "user_2_plan_2"}
        ]}
        """
