Feature: Event Embedded Planning

    @auth
    @vocabulary
    Scenario: Can create and update associated Planning with an Event
        # Test creating and Event with a Planning item/Coveage
        When we post to "/events"
        """
        [{
            "guid": "event1",
            "name": "Event1",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "embedded_planning": [{
                "coverages": [{
                    "g2_content_type": "text",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2029-11-21T15:00:00.000Z"
                }]
            }],
            "subject": [
                {"name": "Test", "qcode": "test", "scheme": "test"}
            ]
        }]
        """
        Then we get OK response
        And we store "EVENT_ID" with value "#events._id#" to context
        When we get "/events"
        Then we get list with 1 items
        """
        {"_items": [{
            "guid": "event1",
            "type": "event",
            "original_creator": "#CONTEXT_USER_ID#",
            "firstcreated": "__now__",
            "versioncreated": "__now__"
        }]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&event_item=event1"
        Then we get list with 1 items
        """
        {"_items": [{
            "_id": "__any_value__",
            "original_creator": "#CONTEXT_USER_ID#",
            "firstcreated": "__now__",
            "versioncreated": "__now__",
            "event_item": "event1",
            "planning_date": "2029-11-21T12:00:00+0000",
            "coverages": [{
                "coverage_id": "__any_value__",
                "firstcreated": "__now__",
                "versioncreated": "__now__",
                "original_creator": "#CONTEXT_USER_ID#",
                "version_creator": "#CONTEXT_USER_ID#",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "scheduled": "2029-11-21T15:00:00+0000"
                }
            }],
            "subject": [
                {"name": "Test", "qcode": "test", "scheme": "test"}
            ]
        }]}
        """
        And we store "PLAN1" with first item
        And we store coverage id in "COVERAGE_ID" from plan 0 coverage 0
        When we get "/events/#EVENT_ID#"
        Then we get existing resource
        """
        {"planning_ids": ["#PLAN1._id#"]}
        """

        # Test updating an existing Planning item, and add new coverage
        When we patch "/events/#EVENT_ID#"
        """
        {"embedded_planning": [
            {
                "planning_id": "#PLAN1._id#",
                "coverages": [
                    {
                        "coverage_id": "#COVERAGE_ID#",
                        "g2_content_type": "text",
                        "news_coverage_status": "ncostat:int",
                        "language": "en",
                        "scheduled": "2029-11-21T15:00:00.000Z",
                        "internal_note": "note something here",
                        "slugline": "test"
                    },
                    {
                        "g2_content_type": "picture",
                        "news_coverage_status": "ncostat:onreq",
                        "language": "en",
                        "scheduled": "2029-11-21T16:00:00.000Z",
                        "internal_note": "only if enough demand",
                        "slugline": "test"
                    }
                ]
            }
        ]}
        """
        Then we get OK response
        When we get "/planning/#PLAN1._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "news_coverage_status": {"qcode": "ncostat:int"},
            "planning": {
                "g2_content_type": "text",
                "scheduled": "2029-11-21T15:00:00+0000",
                "internal_note": "note something here",
                "slugline": "test"
            }
        }, {
            "coverage_id": "__any_value__",
            "news_coverage_status": {"qcode": "ncostat:onreq"},
            "planning": {
                "g2_content_type": "picture",
                "scheduled": "2029-11-21T16:00:00+0000",
                "internal_note": "only if enough demand"
            }
        }]}
        """

        # Test removing a coverage
        When we patch "/events/#EVENT_ID#"
        """
        {"embedded_planning": [
            {
                "planning_id": "#PLAN1._id#",
                "coverages": [
                    {
                        "g2_content_type": "picture",
                        "news_coverage_status": "ncostat:onreq",
                        "language": "en",
                        "scheduled": "2029-11-21T16:00:00.000Z",
                        "internal_note": "only if enough demand",
                        "slugline": "test"
                    }
                ]
            }
        ]}
        """
        Then we get OK response
        When we get "/planning/#PLAN1._id#"
        Then we get 1 coverages
        And we get existing resource
        """
        {"coverages": [{
            "coverage_id": "__any_value__",
            "news_coverage_status": {"qcode": "ncostat:onreq"},
            "planning": {
                "g2_content_type": "picture",
                "scheduled": "2029-11-21T16:00:00+0000",
                "internal_note": "only if enough demand"
            }
        }]}
        """

    @auth
    @vocabulary
    Scenario: Can create multilingual Planning with multilingual Event
        Given "planning_types"
        """
        [{
            "_id": "event",
            "name": "event",
            "editor": {
                "language": {"enabled": true},
                "name": {"enabled": true},
                "slugline": {"enabled": true},
                "definition_short": {"enabled": true},
                "internal_note": {"enabled": true},
                "ednote": {"enabled": true},
                "priority": {"enabled": true},
                "place": {"enabled": true},
                "subject": {"enabled": true},
                "anpa_category": {"enabled": true}
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
                "definition_short": {"multilingual": true},
                "ednote": {"multilingual": true},
                "internal_note": {"multilingual": true}
            }
        }, {
            "_id": "planing",
            "name": "planning",
            "editor": {
                "language": {"enabled": true},
                "name": {"enabled": true},
                "slugline": {"enabled": true},
                "description_text": {"enabled": true},
                "internal_note": {"enabled": true},
                "ednote": {"enabled": true},
                "priority": {"enabled": true},
                "place": {"enabled": true},
                "subject": {"enabled": true},
                "anpa_category": {"enabled": true}
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
                "description_text": {"multilingual": true},
                "ednote": {"multilingual": true},
                "internal_note": {"multilingual": true}
            }
        }, {
            "_id": "coverage",
            "name": "coverage",
            "editor": {
                "g2_content_type": {"enabled": true},
                "slugline": {"enabled": true},
                "ednote": {"enabled": true},
                "internal_note": {"enabled": true},
                "language": {"enabled": true},
                "priority": {"enabled": true},
                "genre": {"enabled": true}
            }
        }]
        """
        When we post to "/events"
        """
        [{
            "guid": "event1",
            "name": "name1",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "slugline": "slugline1",
            "definition_short": "The description",
            "internal_note": "event internal note",
            "ednote": "event editorial note",
            "language": "en",
            "languages": ["en", "nl"],
            "priority": 2,
            "place": [{
                "name": "NSW",
                "qcode": "NSW",
                "state": "New South Wales",
                "country": "Australia",
                "world_region": "Oceania",
                "group": "Australia"
            }],
            "subject":[{"qcode": "17004000", "name": "Statistics"}],
            "anpa_category": [{"name": "Overseas Sport", "qcode": "s"}],
            "translations": [
                {"field": "name", "language": "en", "value": "name-en"},
                {"field": "name", "language": "nl", "value": "name-nl"},
                {"field": "slugline", "language": "en", "value": "slugline-en"},
                {"field": "slugline", "language": "nl", "value": "slugline-nl"},
                {"field": "definition_short", "language": "en", "value": "description en"},
                {"field": "definition_short", "language": "nl", "value": "description nl"},
                {"field": "ednote", "language": "en", "value": "ednote en"},
                {"field": "ednote", "language": "nl", "value": "ednote nl"},
                {"field": "internal_note", "language": "en", "value": "internal note en"},
                {"field": "internal_note", "language": "nl", "value": "internal note nl"}
            ],
            "embedded_planning": [{
                "coverages": [{
                    "g2_content_type": "text",
                    "language": "en",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2029-11-21T15:00:00+0000",
                    "genre": "Article"
                }, {
                    "g2_content_type": "text",
                    "language": "nl",
                    "news_coverage_status": "ncostat:onreq",
                    "scheduled": "2029-11-21T16:00:00+0000",
                    "genre": "Sidebar"
                }]
            }]
        }]
        """
        Then we get OK response
        When we get "/events_planning_search?repo=planning&only_future=false&event_item=event1"
        Then we get list with 1 items
        """
        {"_items": [{
            "_id": "__any_value__",
            "slugline": "slugline1",
            "internal_note": "event internal note",
            "name": "name1",
            "description_text": "The description",
            "place": [{
                "name": "NSW",
                "qcode": "NSW",
                "state": "New South Wales",
                "country": "Australia",
                "world_region": "Oceania",
                "group": "Australia"
            }],
            "subject":[{"qcode": "17004000", "name": "Statistics"}],
            "ednote": "event editorial note",
            "language": "en",
            "languages": ["en", "nl"],
            "priority": 2,
            "translations": [
                {"field": "name", "language": "en", "value": "name-en"},
                {"field": "name", "language": "nl", "value": "name-nl"},
                {"field": "slugline", "language": "en", "value": "slugline-en"},
                {"field": "slugline", "language": "nl", "value": "slugline-nl"},
                {"field": "description_text", "language": "en", "value": "description en"},
                {"field": "description_text", "language": "nl", "value": "description nl"},
                {"field": "ednote", "language": "en", "value": "ednote en"},
                {"field": "ednote", "language": "nl", "value": "ednote nl"},
                {"field": "internal_note", "language": "en", "value": "internal note en"},
                {"field": "internal_note", "language": "nl", "value": "internal note nl"}
            ],
            "coverages": [{
                "coverage_id": "__any_value__",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "en",
                    "scheduled": "2029-11-21T15:00:00+0000",
                    "ednote": "ednote en",
                    "internal_note": "internal note en",
                    "slugline": "slugline-en",
                    "priority": 2,
                    "genre": [{"name": "Article (news)", "qcode": "Article"}]
                }
            }, {
                "coverage_id": "__any_value__",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:onreq", "name": "coverage upon request", "label": "On request"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "nl",
                    "scheduled": "2029-11-21T16:00:00+0000",
                    "ednote": "ednote nl",
                    "internal_note": "internal note nl",
                    "slugline": "slugline-nl",
                    "priority": 2,
                    "genre": [{"name": "Sidebar", "qcode": "Sidebar"}]
                }
            }]
        }]}
        """

    @auth
    @vocabulary
    Scenario: Creates Planning with null values removed
        When we post to "/events"
        """
        [{
            "guid": "event1",
            "name": "name1",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "embedded_planning": [{
                "coverages": [{
                    "g2_content_type": "text",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2029-11-21T15:00:00+0000",
                    "slugline": null
                }]
            }]
        }]
        """
        Then we get OK response
        When we get "/events_planning_search?repo=planning&only_future=false&event_item=event1"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_item": "event1",
            "slugline": "__no_value__",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "slugline": "__no_value__"
                }
            }]
        }]}
        """
        And we store "PLAN1" with first item
        And we store coverage id in "COVERAGE_ID" from plan 0 coverage 0
        When we post to "/planning/#PLAN1._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we store response in "PLAN1"
        When we create "planning" autosave from context item "PLAN1"
        Then we get OK response
        When we delete "/planning_autosave/#PLAN1._id#"
        Then we get OK response
        When we patch "/events/event1"
        """
        {
            "embedded_planning": [{
                "planning_id": "#PLAN1._id#",
                "coverages": [{"coverage_id": "#COVERAGE_ID#", "slugline": "Testing"}]
            }]
        }
        """
        Then we get OK response
        When we get "/planning/#PLAN1._id#"
        Then we get existing resource
        """
        {
            "_id": "#PLAN1._id#",
            "coverages": [{"coverage_id": "#COVERAGE_ID#", "planning": {"slugline": "Testing"}}]
        }
        """
        When we patch "/events/event1"
        """
        {
            "embedded_planning": [{
                "planning_id": "#PLAN1._id#",
                "coverages": [{"coverage_id": "#COVERAGE_ID#", "slugline": null}]
            }]
        }
        """
        Then we get OK response
        When we get "/planning/#PLAN1._id#"
        Then we get existing resource
        """
        {
            "_id": "#PLAN1._id#",
            "coverages": [{"coverage_id": "#COVERAGE_ID#", "planning": {"slugline": ""}}]
        }
        """
        Then we store response in "PLAN1"
        When we create "planning" autosave from context item "PLAN1"
        Then we get OK response
