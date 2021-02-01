Feature: Planning Search
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
                    "recurrence_id": "recur1",
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
                "name": "name123",
                "planning_date": "2016-01-02T12:00:00+0000",
                "agendas": ["sports"],
                "subject": [{"qcode": "test qcode 1", "name": "test name"}],
                "coverages": [
                    {
                        "coverage_id": "cov1",
                        "planning": {
                            "slugline": "slug0123",
                            "g2_content_type": "text"
                        }
                    }
                ]
            },
            {
                "guid": "planning_2",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug123",
                "name": "name456",
                "event_item": "event_123",
                "planning_date": "2016-01-02T13:00:00+0000",
                "anpa_category": [
                    {"name": "Overseas Sport", "qcode": "s"}
                ],
                "coverages": [
                    {
                        "coverage_id": "cov2",
                        "planning": {
                            "slugline": "slug0456",
                            "g2_content_type": "text"
                        }
                    }
                ],
                "urgency": 2
            },
            {
                "guid": "planning_3",
                "item_class": "item class value",
                "state": "published",
                "pubstatus": "usable",
                "headline": "test headline",
                "slugline": "slug456",
                "name": "name789",
                "event_item": "event_456",
                "recurrence_id": "recur1",
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["finance"],
                "subject": [{"qcode": "test qcode 2", "name": "test name"}],
                "coverages": [
                    {
                        "coverage_id": "cov3",
                        "planning": {
                            "slugline": "slug0789",
                            "g2_content_type": "photo"
                        }
                    }
                ],
                "urgency": 2,
                "featured": false
            },
            {
                "guid": "planning_4",
                "item_class": "item class value",
                "state": "cancelled",
                "headline": "test headline",
                "slugline": "slug456",
                "name": "name012",
                "event_item": "event_456",
                "recurrence_id": "recur1",
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["entertainment"],
                "anpa_category": [
                    {"name": "Overseas Sport", "qcode": "s"},
                    {"name": "International News", "qcode": "i"}
                ],
                "featured": true
            },
            {
                "guid": "planning_5",
                "item_class": "item class value",
                "state": "rescheduled",
                "headline": "test headline",
                "slugline": "slug789",
                "name": "name345",
                "event_item": "event_786",
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["sports", "finance"],
                "language": "en",
                "place": [
                    {
                        "group": "Rest Of World",
                        "name": "ASIA",
                        "state": "",
                        "qcode": "ASIA",
                        "world_region": "Asia",
                        "country": ""
                    }
                ],
                "lock_session": "ident1"
            },
            {
                "guid": "planning_6",
                "item_class": "item class value",
                "state": "rescheduled",
                "headline": "test headline",
                "slugline": "slug789",
                "name": "name678",
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["entertainment"]
            }
        ]
        """

    @auth
    Scenario: Only retrieve planning items when using repo=planning
        When we get "/events_planning_search?repo=planning&only_future=false"
        Then we get list with 6 items
        """
        {"_items": [
            {"_id": "planning_1"},
            {"_id": "planning_2"},
            {"_id": "planning_3"},
            {"_id": "planning_4"},
            {"_id": "planning_5"},
            {"_id": "planning_6"}
        ]}
        """

    @auth
    Scenario: Search by common parameters
        When we get "/events_planning_search?repo=planning&only_future=false&item_ids=planning_4,planning_5"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "planning_4"},
            {"_id": "planning_5"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&name=name789"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_3"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&full_text=slug456%20AND%20name012"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_4"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&anpa_category=s"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "planning_2"},
            {"_id": "planning_4"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&subject=test%20qcode%202"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_3"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&posted=true"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_3"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&place=ASIA"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_5"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&language=en"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_5"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&lock_state=locked"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_5"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&lock_state=unlocked"
        Then we get list with 5 items
        """
        {"_items": [
            {"_id": "planning_1"},
            {"_id": "planning_2"},
            {"_id": "planning_3"},
            {"_id": "planning_4"},
            {"_id": "planning_6"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&recurrence_id=recur1"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "planning_3"},
            {"_id": "planning_4"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&state=cancelled,rescheduled"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "planning_4"},
            {"_id": "planning_5"},
            {"_id": "planning_6"}
        ]}
        """

    @auth
    Scenario: Search by planning specific parameters
        When we get "/events_planning_search?repo=planning&only_future=false&agendas=sports,finance"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "planning_1"},
            {"_id": "planning_3"},
            {"_id": "planning_5"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&no_agenda_assigned=true"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_2"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&ad_hoc_planning=true"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "planning_1"},
            {"_id": "planning_6"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&exclude_rescheduled_and_cancelled=true"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "planning_1"},
            {"_id": "planning_2"},
            {"_id": "planning_3"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&slugline=slug123"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "planning_1"},
            {"_id": "planning_2"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&slugline=slug0123"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_1"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&urgency=2"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "planning_2"},
            {"_id": "planning_3"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&g2_content_type=text"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "planning_1"},
            {"_id": "planning_2"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&no_coverage=true"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "planning_4"},
            {"_id": "planning_5"},
            {"_id": "planning_6"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&featured=true"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "planning_4"}
        ]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&event_item=event_456"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "planning_3"},
            {"_id": "planning_4"}
        ]}
        """

    @auth
    Scenario: Search using Agenda with ObjectId
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "guid": "plan_with_agenda",
            "headline": "test agenda",
            "slugline": "slug_agenda",
            "name": "name_agenda",
            "planning_date": "2016-01-02T14:00:00+0000",
            "agendas": ["#agenda._id#"]
        }]
        """
        Then we get OK response
        When we get "/events_planning_search?repo=planning&only_future=false&agendas=#agenda._id#"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "plan_with_agenda"}
        ]}
        """
