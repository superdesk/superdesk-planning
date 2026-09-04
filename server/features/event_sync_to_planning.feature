Feature: Sync Event metadata To Planning
    Background: Setup CVs
        Given "planning_types"
        """
        [{
            "name": "event",
            "type": "event",
            "editor": {
                "language": {"enabled": true},
                "name": {"enabled": true},
                "slugline": {"enabled": true},
                "ednote": {"enabled": true},
                "anpa_category": {"enabled": true},
                "definition_short": {"enabled": true}
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
                "definition_short": {"multilingual": true}
            }
        }, {
            "name": "planning",
            "type": "planning",
            "editor": {
                "language": {"enabled": true},
                "name": {"enabled": true},
                "slugline": {"enabled": true},
                "ednote": {"enabled": true},
                "anpa_category": {"enabled": true},
                "description_text": {"enabled": true}
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
                "description_text": {"multilingual": true}
            }
        }, {
            "name": "coverage",
            "type": "coverage",
            "content_type": "text",
            "editor": {
                "g2_content_type": {"enabled": true},
                "slugline": {"enabled": true},
                "ednote": {"enabled": true},
                "language": {"enabled": true}
            }
        }]
        """

    @auth
    @vocabulary
    Scenario: Sync Event metadata to Planning
        Given config update
        """
        {"SYNC_EVENT_FIELDS_TO_PLANNING": ["slugline", "name", "anpa_category", "language"]}
        """

        # Create the initial Event & Planning
        # No need to check result, as this is covered in ``event_embedded_planning.feature``
        # ``Can create multilingual Planning with multilingual Event`` scenario
        When we post to "/events"
        """
        [{
            "guid": "event1",
            "ednote": "event editorial note",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "language": "en",
            "languages": ["en"],
            "anpa_category": [{"name": "Overseas Sport", "qcode": "s"}],
            "translations": [
                {"field": "name", "language": "en", "value": "name-en"},
                {"field": "slugline", "language": "en", "value": "slugline-en"}
            ],
            "embedded_planning": [{
                "coverages": [{
                    "g2_content_type": "text",
                    "language": "en",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2029-11-21T15:00:00+0000"
                }, {
                    "g2_content_type": "text",
                    "language": "nl",
                    "news_coverage_status": "ncostat:onreq",
                    "scheduled": "2029-11-21T16:00:00+0000"
                }]
            }]
        }]
        """
        Then we get OK response
        And we store "EVENT_ID" with value "#events._id#" to context
        When we get "/events_planning_search?repo=planning&only_future=false&event_item=event1"
        Then we get list with 1 items
        """
        {"_items": [{
            "slugline": "slugline-en",
            "name": "name-en",
            "ednote": "event editorial note",
            "anpa_category": [{"name": "Overseas Sport", "qcode": "s"}],
            "language": "en",
            "languages": ["en"],
            "translations": [
                {"field": "name", "language": "en", "value": "name-en"},
                {"field": "slugline", "language": "en", "value": "slugline-en"}
            ],
            "coverages": [{
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "en",
                    "slugline": "slugline-en",
                    "ednote": "event editorial note"
                }
            }, {
                "news_coverage_status": {"qcode": "ncostat:onreq", "name": "coverage upon request", "label": "On request"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "nl",
                    "slugline": "slugline-en",
                    "ednote": "event editorial note"
                }
            }]
        }]}
        """
        And we store "PLAN1" with first item
        And we store coverage id in "COVERAGE1_ID" from plan 0 coverage 0
        And we store coverage id in "COVERAGE2_ID" from plan 0 coverage 1
        # Update the Event's slugline, name, anpa_category and languge fields are synced, and ednote
        When we patch "/events/#EVENT_ID#"
        """
        {
            "ednote": "event editorial note 2",
            "languages": ["en", "nl"],
            "anpa_category": [
                {"name": "Overseas Sport", "qcode": "s"},
                {"name": "International News", "qcode": "i"}
            ],
            "translations": [
                {"field": "name", "language": "en", "value": "name-en-2"},
                {"field": "name", "language": "nl", "value": "name-nl-1"},
                {"field": "slugline", "language": "en", "value": "slugline-en-2"},
                {"field": "slugline", "language": "nl", "value": "slugline-nl-1"}
            ]
        }
        """
        Then we get OK response
        # Test that the slugline, name, anpa_category and languge fields are synced, and ednote is not
        When we get "/planning/#PLAN1._id#"
        Then we get existing resource
        """
        {
            "_id": "#PLAN1._id#",
            "slugline": "slugline-en-2",
            "name": "name-en-2",
            "ednote": "event editorial note",
            "anpa_category": [
                {"name": "Overseas Sport", "qcode": "s"},
                {"name": "International News", "qcode": "i"}
            ],
            "language": "en",
            "languages": ["en", "nl"],
            "translations": [
                {"field": "name", "language": "en", "value": "name-en-2"},
                {"field": "name", "language": "nl", "value": "name-nl-1"},
                {"field": "slugline", "language": "en", "value": "slugline-en-2"},
                {"field": "slugline", "language": "nl", "value": "slugline-nl-1"}
            ],
            "coverages": [{
                "coverage_id": "#COVERAGE1_ID#",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "en",
                    "slugline": "slugline-en-2",
                    "ednote": "event editorial note"
                }
            }, {
                "coverage_id": "#COVERAGE2_ID#",
                "news_coverage_status": {"qcode": "ncostat:onreq", "name": "coverage upon request", "label": "On request"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "nl",
                    "slugline": "slugline-nl-1",
                    "ednote": "event editorial note"
                }
            }]
        }
        """
        # Update the 1st Coverage so the slugline deviate from the parent Event item
        When we patch "/events/#EVENT_ID#"
        """
        {"embedded_planning": [{
            "planning_id": "#PLAN1._id#",
            "coverages": [
                {
                    "coverage_id": "#COVERAGE1_ID#",
                    "slugline": "coverage-1-slugline-1",
                    "scheduled": "2029-11-21T15:00:00+0000",
                    "g2_content_type": "text",
                    "news_coverage_status": "ncostat:int"
                },
                {
                    "coverage_id": "#COVERAGE2_ID#",
                    "scheduled": "2029-11-21T16:00:00+0000",
                    "g2_content_type": "text",
                    "news_coverage_status": "ncostat:onreq"
                }
            ]
        }]}
        """
        Then we get OK response
        When we get "/planning/#PLAN1._id#"
        Then we get existing resource
        """
        {
            "_id": "#PLAN1._id#",
            "coverages": [{
                "coverage_id": "#COVERAGE1_ID#",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "en",
                    "slugline": "coverage-1-slugline-1",
                    "ednote": "event editorial note"
                }
            }, {
                "coverage_id": "#COVERAGE2_ID#",
                "news_coverage_status": {"qcode": "ncostat:onreq", "name": "coverage upon request", "label": "On request"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "nl",
                    "slugline": "slugline-nl-1",
                    "ednote": "event editorial note"
                }
            }]
        }
        """
        # Now update the Event's slugline
        When we patch "/events/#EVENT_ID#"
        """
        {"translations": [
            {"field": "name", "language": "en", "value": "name-en-3"},
            {"field": "name", "language": "nl", "value": "name-nl-2"},
            {"field": "slugline", "language": "en", "value": "slugline-en-3"},
            {"field": "slugline", "language": "nl", "value": "slugline-nl-2"}
        ]}
        """
        Then we get OK response
        # Now make sure the 1st Coverage's slugline does not change
        # as it's value was different than the Event's when this change request was made
        When we get "/planning/#PLAN1._id#"
        Then we get existing resource
        """
        {
            "_id": "#PLAN1._id#",
            "coverages": [{
                "coverage_id": "#COVERAGE1_ID#",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "en",
                    "slugline": "coverage-1-slugline-1",
                    "ednote": "event editorial note"
                }
            }, {
                "coverage_id": "#COVERAGE2_ID#",
                "news_coverage_status": {"qcode": "ncostat:onreq", "name": "coverage upon request", "label": "On request"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "nl",
                    "slugline": "slugline-nl-2",
                    "ednote": "event editorial note"
                }
            }]
        }
        """

    @auth
    @vocabulary
    Scenario: Sync Event multilingual fields to Planning
        Given config update
        """
        {"SYNC_EVENT_FIELDS_TO_PLANNING": ["slugline", "name", "definition_short", "language"]}
        """
        When we post to "/events"
        """
        [{
            "guid": "event1",
            "ednote": "event editorial note",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "language": "nl",
            "languages": ["nl", "fr"],
            "translations": [
                {"field": "name", "language": "nl", "value": "name-nl"},
                {"field": "name", "language": "fr", "value": "name-fr"},
                {"field": "slugline", "language": "nl", "value": "slugline-nl"},
                {"field": "slugline", "language": "fr", "value": "slugline-fr"},
                {"field": "definition_short", "language": "nl", "value": "desc-nl"},
                {"field": "definition_short", "language": "fr", "value": "desc-fr"}
            ],
            "embedded_planning": [{
                "coverages": [{
                    "g2_content_type": "text",
                    "language": "nl",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2029-11-21T15:00:00+0000"
                }, {
                    "g2_content_type": "text",
                    "language": "fr",
                    "news_coverage_status": "ncostat:onreq",
                    "scheduled": "2029-11-21T16:00:00+0000"
                }]
            }]
        }]
        """
        Then we get OK response
        And we store "EVENT_ID" with value "#events._id#" to context
        When we get "/events_planning_search?repo=planning&only_future=false&event_item=event1"
        Then we get list with 1 items
        """
        {"_items": [{
            "slugline": "slugline-nl",
            "name": "name-nl",
            "description_text": "desc-nl",
            "ednote": "event editorial note",
            "language": "nl",
            "languages": ["nl", "fr"],
            "translations": [
                {"field": "name", "language": "nl", "value": "name-nl"},
                {"field": "name", "language": "fr", "value": "name-fr"},
                {"field": "slugline", "language": "nl", "value": "slugline-nl"},
                {"field": "slugline", "language": "fr", "value": "slugline-fr"},
                {"field": "description_text", "language": "nl", "value": "desc-nl"},
                {"field": "description_text", "language": "fr", "value": "desc-fr"}
            ],
            "coverages": [{
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "nl",
                    "slugline": "slugline-nl",
                    "ednote": "event editorial note"
                }
            }, {
                "news_coverage_status": {"qcode": "ncostat:onreq"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "fr",
                    "slugline": "slugline-fr",
                    "ednote": "event editorial note"
                }
            }]
        }]}
        """
        And we store "PLAN1" with first item
        And we store coverage id in "COVERAGE1_ID" from plan 0 coverage 0
        And we store coverage id in "COVERAGE2_ID" from plan 0 coverage 1

        When we patch "/events/#EVENT_ID#"
        """
        {"translations": [
            {"field": "name", "language": "nl", "value": "name-nl-2"},
            {"field": "name", "language": "fr", "value": "name-fr-2"},
            {"field": "slugline", "language": "nl", "value": "slugline-nl-2"},
            {"field": "slugline", "language": "fr", "value": "slugline-fr-2"},
            {"field": "definition_short", "language": "nl", "value": "desc-nl-2"},
            {"field": "definition_short", "language": "fr", "value": "desc-fr-2"}
        ]}
        """
        Then we get OK response
        When we get "/planning/#PLAN1._id#"
        Then we get existing resource
        """
        {
            "_id": "#PLAN1._id#",
            "slugline": "slugline-nl-2",
            "name": "name-nl-2",
            "description_text": "desc-nl-2",
            "languages": ["nl", "fr"],
            "translations": [
                {"field": "name", "language": "nl", "value": "name-nl-2"},
                {"field": "name", "language": "fr", "value": "name-fr-2"},
                {"field": "slugline", "language": "nl", "value": "slugline-nl-2"},
                {"field": "slugline", "language": "fr", "value": "slugline-fr-2"},
                {"field": "description_text", "language": "nl", "value": "desc-nl-2"},
                {"field": "description_text", "language": "fr", "value": "desc-fr-2"}
            ],
            "coverages": [{
                "coverage_id": "#COVERAGE1_ID#",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "nl",
                    "slugline": "slugline-nl-2",
                    "ednote": "event editorial note"
                }
            }, {
                "coverage_id": "#COVERAGE2_ID#",
                "news_coverage_status": {"qcode": "ncostat:onreq"},
                "planning": {
                    "g2_content_type": "text",
                    "language": "fr",
                    "slugline": "slugline-fr-2",
                    "ednote": "event editorial note"
                }
            }]
        }
        """
        # Make sure we can lock the Planning and create an autosave from it
        When we post to "/planning/#PLAN1._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we store response in "PLAN1"
        When we create "planning" autosave from context item "PLAN1"
        Then we get OK response
