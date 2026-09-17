Feature: Events with Coverages
    Background: Setup data
        When we configure planning for publishing
        Given "desks"
        """
        [
            {"name": "Politic Desk", "members": [{"user": "#CONTEXT_USER_ID#"}]},
            {"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}
        ]
        """
        And we have sessions "/sessions"

    @auth
    Scenario: Create an Event with Coverages
        When we post to "/events"
        """
        [{
            "name": "Event being covered",
            "dates": {
                "start": "2049-11-21T12:00:00+0000",
                "end": "2049-11-21T13:00:00+0000"
            },
            "coverages": [{
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "scheduled": "2049-11-21T13:00:00+0000",
                    "slugline": "test-event-covered",
                    "headline": "Testing of an Event being covered"
                },
                "assigned_to": {
                    "desk": "#desks_0._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }]
        """
        Then we get OK response
        Then we store coverage id in "coverage_id" from coverage 0
        And we store assignment id in "assignment_id" from coverage 0
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "coverages": [{
                "coverage_id": "#coverage_id#",
                "assigned_to": {"assignment_id": "#assignment_id#"}
            }]
        }
        """
        When we get "/assignments/#assignment_id#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "desk": "#desks_0._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "/assignments/"
        Then we get list with 1 items
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        When we get "/assignments/"
        Then we get list with 0 items

    @auth
    Scenario: Coverage and Assignments inherit from Event
        Given "agenda"
        """
        [{"name": "TestAgenda", "is_enabled": true}]
        """
        And "vocabularies"
        """
        [{
            "_id": "sports_code",
            "selection_type": "single selection",
            "display_name": "Sports Codes",
            "service": {"all": 1},
            "items": [
                {"qcode": "cy", "name": "Cycling", "is_active": true},
                {"qcode": "sw", "name": "Swimming", "is_active": true}
            ]
        }]
        """
        And "planning_types"
        """
        [{
            "name": "event",
            "type": "event",
            "editor": {
                "language": {"enable": true},
                "name": {"enabled": true},
                "slugline": {"enabled": true},
                "ednote": {"enabled": true},
                "anpa_category": {"enabled": true},
                "subject": {"enabled": true},
                "priority": {"enabled": true},
                "location": {"enabled": true},
                "headline": {"enabled": true},
                "sports_code": {"enabled": true},
                "calendars": {"enabled": true},
                "agendas": {"enabled": true},
                "place": {"enabled": true},
                "definition_long": {"enabled": true},
                "definition_short": {"enabled": true},
                "keywords": {"enabled": true}
            },
            "schema": {
                "language": {
                    "languages": ["en", "nl"],
                    "default_language": "en",
                    "multilingual": true,
                    "required": true
                },
                "name": {"multilingual": true},
                "slugline": {"multilingual": true},
                "sports_code": {"type": "custom_vocabulary", "required": false}
            }
        }, {
            "name": "Default Coverage",
            "type": "coverage",
            "editor": {
                "g2_content_type": {"enabled": true},
                "slugline": {"enabled": true},
                "headline": {"enabled": true},
                "ednote": {"enabled": true},
                "language": {"enabled": true},
                "anpa_category": {"enabled": true},
                "subject": {"enabled": true},
                "location": {"enabled": true},
                "sports_code": {"enabled": false},

                "genre": {"enabled": true},
                "name": {"enabled": true},
                "calendars": {"enabled": true},
                "agendas": {"enabled": true},
                "place": {"enabled": true},
                "definition_long": {"enabled": true},
                "definition_short": {"enabled": true},
                "priority": {"enabled": true},
                "keyword": {"enabled": true}
            },
            "schema": {
                "g2_content_type": {"required": true},
                "language": {"required": true},
                "sports_code": {"type": "custom_vocabulary", "required": false}
            }
        }, {
            "name": "Text Coverage",
            "type": "coverage",
            "content_type": "text",
            "editor": {
                "definition_long": {"enabled": false},
                "sports_code": {"enabled": true}
            }
        }, {
            "name": "Photo Coverage",
            "type": "coverage",
            "content_type": "photo",
            "editor": {
                "location": {"enabled": false},
                "calendars": {"enabled": false},
                "agendas": {"enabled": false},
                "place": {"enabled": false}
            }
        }]
        """
        When we post to "/events"
        """
        {
            "languages": ["en", "nl"],
            "slugline": "slug-1",
            "ednote": "Something about this event, I forget!",
            "definition_short": "A small abstract of what this Event is about!",
            "definition_long": "A much longer detail of the this Event is about!...",
            "priority": 3,
            "keywords": ["test", "keywords"],
            "subject": [
                {"qcode": "s", "name": "Sports"},
                {"qcode": "sw", "name": "Swimming", "scheme": "sports_code"}
            ],
            "anpa_category": [{"name": "Sport", "qcode": "s"}],
            "dates": {
                "start": "2049-11-21T12:00:00+0000",
                "end": "2049-11-21T13:00:00+0000"
            },
            "agendas": ["#agenda._id#"],
            "calendars": [{"qcode": "finance", "name": "Finance"}],
            "location": [{"qcode": "location_1", "name": "Test Location"}],
            "place": [{
                "name": "NSW",
                "qcode": "NSW",
                "state": "New South Wales",
                "country": "Australia",
                "world_region": "Oceania",
                "group": "Australia"
            }],
            "translations": [
                 {"field": "name", "language": "en", "value": "name-en-1"},
                 {"field": "name", "language": "nl", "value": "name-nl-1"},
                 {"field": "headline", "language": "en", "value": "headline-en-1"},
                 {"field": "headline", "language": "nl", "value": "headline-nl-1"}
            ],
            "coverages": [
                {
                    "workflow_status": "active",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "assigned_to": {"desk": "#desks_0._id#", "user": "#CONTEXT_USER_ID#"},
                    "planning": {"g2_content_type": "text", "language": "en"}
                },
                {
                    "workflow_status": "active",
                    "profile": "#planning_types_2._id#",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "assigned_to": {"desk": "#desks_0._id#", "user": "#CONTEXT_USER_ID#"},
                    "planning": {"g2_content_type": "text", "language": "en"}
                },
                {
                    "workflow_status": "active",
                    "profile": "#planning_types_3._id#",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "assigned_to": {"desk": "#desks_0._id#", "user": "#CONTEXT_USER_ID#"},
                    "planning": {"g2_content_type": "photo", "language": "nl"}
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "COVERAGE_1_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_1_ID" from coverage 0
        Then we store coverage id in "COVERAGE_2_ID" from coverage 1
        And we store assignment id in "ASSIGNMENT_2_ID" from coverage 1
        Then we store coverage id in "COVERAGE_3_ID" from coverage 2
        And we store assignment id in "ASSIGNMENT_3_ID" from coverage 2
        When we get "/assignments/#ASSIGNMENT_1_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#events._id#",
            "coverage_item": "#COVERAGE_1_ID#",
            "name": "name-en-1",
            "original_creator": "#CONTEXT_USER_ID#",
            "version_creator": "#CONTEXT_USER_ID#",
            "description_text": "A much longer detail of the this Event is about!...",
            "planning": {
                "slugline": "slug-1",
                "headline": "headline-en-1",
                "definition_short": "A small abstract of what this Event is about!",
                "definition_long": "A much longer detail of the this Event is about!...",
                "anpa_category": [{"name": "Sport", "qcode": "s"}],
                "subject": [
                    {"qcode": "s", "name": "Sports"}
                ],
                "priority": 3,
                "location": [{"qcode": "location_1", "name": "Test Location"}],
                "name": "name-en-1",
                "agendas": ["#agenda._id#"],
                "calendars": [{"qcode": "finance", "name": "Finance"}],
                "place": [{
                    "name": "NSW",
                    "qcode": "NSW",
                    "state": "New South Wales",
                    "country": "Australia",
                    "world_region": "Oceania",
                    "group": "Australia"
                }],
                "keywords": ["test", "keywords"]
            }
        }
        """
        When we get "/assignments/#ASSIGNMENT_2_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#events._id#",
            "coverage_item": "#COVERAGE_2_ID#",
            "name": "name-en-1",
            "original_creator": "#CONTEXT_USER_ID#",
            "version_creator": "#CONTEXT_USER_ID#",
            "description_text": "A much longer detail of the this Event is about!...",
            "planning": {
                "slugline": "slug-1",
                "headline": "headline-en-1",
                "definition_short": "A small abstract of what this Event is about!",
                "definition_long": "__no_value__",
                "anpa_category": [{"name": "Sport", "qcode": "s"}],
                "subject": [
                    {"qcode": "s", "name": "Sports"},
                    {"qcode": "sw", "name": "Swimming", "scheme": "sports_code"}
                ],
                "priority": 3,
                "location": [{"qcode": "location_1", "name": "Test Location"}],
                "name": "name-en-1",
                "agendas": ["#agenda._id#"],
                "calendars": [{"qcode": "finance", "name": "Finance"}],
                "place": [{
                    "name": "NSW",
                    "qcode": "NSW",
                    "state": "New South Wales",
                    "country": "Australia",
                    "world_region": "Oceania",
                    "group": "Australia"
                }],
                "keywords": ["test", "keywords"]
            }
        }
        """
        When we get "/assignments/#ASSIGNMENT_3_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#events._id#",
            "coverage_item": "#COVERAGE_3_ID#",
            "name": "name-nl-1",
            "original_creator": "#CONTEXT_USER_ID#",
            "version_creator": "#CONTEXT_USER_ID#",
            "planning": {
                "slugline": "slug-1",
                "headline": "headline-nl-1",
                "definition_short": "A small abstract of what this Event is about!",
                "definition_long": "A much longer detail of the this Event is about!...",
                "subject": [{"qcode": "s", "name": "Sports"}],
                "anpa_category": [{"name": "Sport", "qcode": "s"}],
                "priority": 3,
                "location": "__no_value__",
                "name": "name-nl-1",
                "agendas": "__no_value__",
                "calendars": "__no_value__",
                "place": "__no_value__",
                "keywords": ["test", "keywords"]
            }
        }
        """
        When we patch "/events/#events._id#"
        """
        {
            "slugline": "slug-2",
            "ednote": "2. Something about this event, I forget!",
            "definition_short": "2. A small abstract of what this Event is about!",
            "definition_long": "2. A much longer detail of the this Event is about!...",
            "priority": 2,
            "keywords": ["2.test", "keywords"],
            "subject": [
                {"qcode": "sw", "name": "Swimming", "scheme": "sports_code"}
            ],
            "anpa_category": [{"name": "Finance", "qcode": "f"}],
            "dates": {
                "start": "2049-11-21T12:00:00+0000",
                "end": "2049-11-21T13:00:00+0000"
            },
            "agendas": [],
            "calendars": [{"qcode": "sports", "name": "Sports"}],
            "location": [{"qcode": "location_2", "name": "2. Test Location"}],
            "place": [{
                "name": "VIC",
                "qcode": "VIC",
                "state": "Victoria",
                "country": "Australia",
                "world_region": "Oceania",
                "group": "Australia"
            }],
            "translations": [
                 {"field": "name", "language": "en", "value": "name-en-2"},
                 {"field": "name", "language": "nl", "value": "name-nl-2"},
                 {"field": "headline", "language": "en", "value": "headline-en-2"},
                 {"field": "headline", "language": "nl", "value": "headline-nl-2"}
            ],
            "coverages": [
                {
                    "coverage_id": "#COVERAGE_1_ID#",
                    "workflow_status": "active",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "assigned_to": {"desk": "#desks_0._id#", "user": "#CONTEXT_USER_ID#", "assignment_id": "#ASSIGNMENT_1_ID#"},
                    "planning": {"g2_content_type": "text", "language": "en"}
                },
                {
                    "coverage_id": "#COVERAGE_2_ID#",
                    "workflow_status": "active",
                    "profile": "#planning_types_2._id#",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "assigned_to": {"desk": "#desks_0._id#", "user": "#CONTEXT_USER_ID#", "assignment_id": "#ASSIGNMENT_2_ID#"},
                    "planning": {"g2_content_type": "text", "language": "en"}
                },
                {
                    "coverage_id": "#COVERAGE_3_ID#",
                    "workflow_status": "active",
                    "profile": "#planning_types_3._id#",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "assigned_to": {"desk": "#desks_0._id#", "user": "#CONTEXT_USER_ID#", "assignment_id": "#ASSIGNMENT_3_ID#"},
                    "planning": {"g2_content_type": "photo", "language": "nl"}
                }
            ]
        }
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_1_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#events._id#",
            "coverage_item": "#COVERAGE_1_ID#",
            "name": "name-en-2",
            "original_creator": "#CONTEXT_USER_ID#",
            "version_creator": "#CONTEXT_USER_ID#",
            "description_text": "2. A much longer detail of the this Event is about!...",
            "planning": {
                "slugline": "slug-2",
                "headline": "headline-en-2",
                "definition_short": "2. A small abstract of what this Event is about!",
                "definition_long": "2. A much longer detail of the this Event is about!...",
                "anpa_category": [{"name": "Finance", "qcode": "f"}],
                "subject": "__empty__",
                "priority": 2,
                "location": [{"qcode": "location_2", "name": "2. Test Location"}],
                "name": "name-en-2",
                "agendas": "__no_value__",
                "calendars": [{"qcode": "sports", "name": "Sports"}],
                "place": [{
                    "name": "VIC",
                    "qcode": "VIC",
                    "state": "Victoria",
                    "country": "Australia",
                    "world_region": "Oceania",
                    "group": "Australia"
                }],
                "keywords": ["2.test", "keywords"]
            }
        }
        """
        When we get "/assignments/#ASSIGNMENT_2_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#events._id#",
            "coverage_item": "#COVERAGE_2_ID#",
            "name": "name-en-2",
            "original_creator": "#CONTEXT_USER_ID#",
            "version_creator": "#CONTEXT_USER_ID#",
            "description_text": "2. A much longer detail of the this Event is about!...",
            "planning": {
                "slugline": "slug-2",
                "headline": "headline-en-2",
                "definition_short": "2. A small abstract of what this Event is about!",
                "definition_long": "__no_value__",
                "anpa_category": [{"name": "Finance", "qcode": "f"}],
                "subject": [
                    {"qcode": "sw", "name": "Swimming", "scheme": "sports_code"}
                ],
                "priority": 2,
                "location": [{"qcode": "location_2", "name": "2. Test Location"}],
                "name": "name-en-2",
                "agendas": "__no_value__",
                "calendars": [{"qcode": "sports", "name": "Sports"}],
                "place": [{
                    "name": "VIC",
                    "qcode": "VIC",
                    "state": "Victoria",
                    "country": "Australia",
                    "world_region": "Oceania",
                    "group": "Australia"
                }],
                "keywords": ["2.test", "keywords"]
            }
        }
        """
        When we get "/assignments/#ASSIGNMENT_3_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#events._id#",
            "coverage_item": "#COVERAGE_3_ID#",
            "name": "name-nl-2",
            "original_creator": "#CONTEXT_USER_ID#",
            "version_creator": "#CONTEXT_USER_ID#",
            "planning": {
                "slugline": "slug-2",
                "headline": "headline-nl-2",
                "definition_short": "2. A small abstract of what this Event is about!",
                "definition_long": "2. A much longer detail of the this Event is about!...",
                "anpa_category": [{"name": "Finance", "qcode": "f"}],
                "priority": 2,
                "location": "__no_value__",
                "name": "name-nl-2",
                "agendas": "__no_value__",
                "calendars": "__no_value__",
                "place": "__no_value__",
                "keywords": ["2.test", "keywords"]
            }
        }
        """
