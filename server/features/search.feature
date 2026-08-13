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
        When we get "/events_planning_search?only_future=false"
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
        When we get "/events_planning_search?only_future=false"
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
        When we get "/events_planning_search?only_future=false"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "planning_123", "type": "planning"},
                {"_id": "event_123", "type": "event"}
            ]
        }
        """
        When we get "/events_planning_search?only_future=false&slugline=slugline"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "planning_123", "type": "planning"},
                {"_id": "event_123", "type": "event"}
            ]
        }
        """
        When we get "/events_planning_search?repo=planning&only_future=false&headline=test"
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
                "related_events": [{"_id": "event_123", "link_type": "primary"}],
                "planning_date": "2016-01-02T13:00:00+0000"
            },
            {
                "guid": "planning_789",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "related_events": [{"_id": "event_123", "link_type": "primary"}],
                "subject": [{"qcode": "111", "name": "test name"}],
                "planning_date": "2016-01-02T14:00:00+0000"
            }
        ]
        """
        When we get "/events_planning_search?start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 4 items
        """
        {
            "_items": [
                {"_id": "planning_123", "type": "planning"},
                {"_id": "event_123", "type": "event"},
                {"_id": "planning_456", "type": "planning"},
                {"_id": "planning_789", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?slugline=slug123&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "planning_123", "type": "planning"},
                {"_id": "planning_456", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?subject=111&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 1 items
        """
        {
            "_items": [
                {"_id": "planning_789", "type": "planning"}
            ]
        }
        """


    @auth
    Scenario: Search events and planning using calendars and agenda
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
                    "unique_name": "name 456",
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
                    "unique_name": "name 789",
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
                "agendas": ["68e5df45ac0f6c8b678c17b1"]
            },
            {
                "guid": "planning_2",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug123",
                "related_events": [{"_id": "event_123", "link_type": "primary"}],
                "planning_date": "2016-01-02T13:00:00+0000",
                "agendas": ["68e5df45ac0f6c8b678c17b1"]
            },
            {
                "guid": "planning_3",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "related_events": [{"_id": "event_456", "link_type": "primary"}],
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["68e5df45ac0f6c8b678c17b2"]
            },
            {
                "guid": "planning_4",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "related_events": [{"_id": "event_456", "link_type": "primary"}],
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["68e5df45ac0f6c8b678c17b3"]
            },
            {
                "guid": "planning_5",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "related_events": [{"_id": "event_786", "link_type": "primary"}],
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["68e5df45ac0f6c8b678c17b1", "68e5df45ac0f6c8b678c17b2"]
            },
            {
                "guid": "planning_6",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "slug456",
                "planning_date": "2016-01-02T14:00:00+0000",
                "agendas": ["68e5df45ac0f6c8b678c17b3"]
            }
        ]
        """
        When we get "/events_planning_search?start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 9 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "planning_2", "type": "planning"},
                {"_id": "planning_1", "type": "planning"},
                {"_id": "event_456", "type": "event"},
                {"_id": "planning_3", "type": "planning"},
                {"_id": "planning_4", "type": "planning"},
                {"_id": "event_786", "type": "event"},
                {"_id": "planning_5", "type": "planning"},
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
        When we get "/events_planning_search?agendas=68e5df45ac0f6c8b678c17b1&calendars=sports&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 5 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "planning_2", "type": "planning"},
                {"_id": "event_786", "type": "event"},
                {"_id": "planning_5", "type": "planning"},
                {"_id": "planning_1", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?agendas=68e5df45ac0f6c8b678c17b1&calendars=sports,finance&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 5 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "planning_2", "type": "planning"},
                {"_id": "event_786", "type": "event"},
                {"_id": "planning_5", "type": "planning"},
                {"_id": "planning_1", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?agendas=68e5df45ac0f6c8b678c17b1,68e5df45ac0f6c8b678c17b2&calendars=sports,finance&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 6 items
        """
        {
            "_items": [
                {"_id": "event_123", "type": "event"},
                {"_id": "planning_2", "type": "planning"},
                {"_id": "planning_3", "type": "planning"},
                {"_id": "event_786", "type": "event"},
                {"_id": "planning_5", "type": "planning"},
                {"_id": "planning_1", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?agendas=68e5df45ac0f6c8b678c17b3&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 2 items
        """
        {
            "_items": [
                {"_id": "planning_4", "type": "planning"},
                {"_id": "planning_6", "type": "planning"}
            ]
        }
        """
        When we get "/events_planning_search?agendas=68e5df45ac0f6c8b678c17b1&start_date=2016-01-02T00:00:00%2B0000"
        Then we get list with 3 items
        """
        {
            "_items": [
                {"_id": "planning_2", "type": "planning"},
                {"_id": "planning_5", "type": "planning"},
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

    @auth
    Scenario: Search events by custom CV
        Given "events"
            """
            [
                {
                    "guid": "event_123",
                    "name": "event",
                    "subject": [
                        {"name": "Foo", "qcode": "foo", "scheme": "scheme1"},
                        {"name": "Bar", "qcode": "bar", "scheme": "scheme1"}
                    ],
                    "dates": {
                        "start": "2035-01-02T00:00:00+0000",
                        "end": "2035-01-03T00:00:00+0000"
                    }
                }
            ]
            """

        When we get "/events_planning_search?subject=scheme1:foo"
        Then we get list with 1 items

        When we get "/events_planning_search?subject=scheme2:foo"
        Then we get list with 0 items

        When we get "/events_planning_search?subject=foo"
        Then we get list with 0 items

    @auth
    Scenario: Search events by text fields
        Given "events"
            """
            [
                {
                    "guid": "event_123",
                    "name": "event",
                    "ednote": "ednote text",
                    "internal_note": "internal note text",
                    "slugline": "test slugline",
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "registration_details": "registration details text",
                    "invitation_details": "invitation details text",
                    "accreditation_info": "accreditation info text",
                    "reference": "reference text",
                    "registration": "registration text",
                    "dates": {
                        "start": "2035-01-02T00:00:00+0000",
                        "end": "2035-01-03T00:00:00+0000"
                    }
                }
            ]
            """

        When we get "/events_planning_search?slugline=test"
        Then we get list with 1 items

        When we get "/events_planning_search?slugline=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?ednote=text"
        Then we get list with 1 items

        When we get "/events_planning_search?ednote=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?internal_note=text"
        Then we get list with 1 items

        When we get "/events_planning_search?internal_note=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=events&definition_short=short"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=events&definition_short=long"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=events&definition_long=long"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=events&definition_long=short"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=events&registration_details=details"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=events&registration_details=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=events&invitation_details=invitation"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=events&invitation_details=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=events&accreditation_info=info"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=events&accreditation_info=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=events&reference=reference"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=events&reference=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=events&registration=registration"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=events&registration=foo"
        Then we get list with 0 items

    @auth
    Scenario: Search planning by text fields
        Given "planning"
            """
            [
                {
                    "guid": "event_123",
                    "name": "event",
                    "ednote": "ednote text",
                    "internal_note": "internal note text",
                    "abstract": "abstract text",
                    "headline": "headline text",
                    "slugline": "slugline text",
                    "keywords": ["keywords", "text"],
                    "priority": 2,
                    "description_text": "description text",
                    "planning_date": "2035-07-31T00:00:00+0000"
                }
            ]
            """

        When we get "/events_planning_search?slugline=slugline"
        Then we get list with 1 items

        When we get "/events_planning_search?slugline=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?ednote=ednote"
        Then we get list with 1 items

        When we get "/events_planning_search?ednote=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?internal_note=internal"
        Then we get list with 1 items

        When we get "/events_planning_search?internal_note=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=planning&description_text=description"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=planning&description_text=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=planning&abstract=abstract"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=planning&abstract=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=planning&headline=headline"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=planning&headline=foo"
        Then we get list with 0 items

        When we get "/events_planning_search?repo=planning&keywords=keywords"
        Then we get list with 1 items

        When we get "/events_planning_search?repo=planning&keywords=foo"
        Then we get list with 0 items

    @auth
    Scenario: Search planning by assigned user
        Given "users"
        """
        [{"username": "John"}]
        """
        Given "planning"
        """
        [
            {
                "guid": "event_123",
                "name": "event",
                "planning_date": "2035-07-31T00:00:00+0000",
                "coverages": [
                    {
                        "workflow_status": "draft",
                        "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                        "assigned_to": {"user": "#users._id#"}
                    }
                ]
            }
        ]
        """
        When we get "/events_planning_search?repo=planning&coverage_user_id=#users._id#"
        Then we get list with 1 items
