Feature: Planning Validate
    Background: Initial Setup
        Given the "planning_types"
        """
        [{
            "name": "event",
            "type": "event",
            "schema": {
                "slugline": {
                    "type": "string",
                    "required": true,
                    "validate_on_post": true
                },
                "name": {
                    "type": "string",
                    "required": true
                },
                "calendars": {
                    "type": "list",
                    "required": true,
                    "validate_on_post": true
                },
                "definition_short": {
                    "type": "string",
                    "required": false
                },
                "place": {
                    "type": "list",
                    "required": false
                }
            }
        }, {
            "name": "planning",
            "type": "planning",
            "editor":{
                "place": {
                    "enabled":true
                },
                "description_text": {
                    "enabled":true
                }
            },
            "schema": {
                "slugline": {
                    "type": "string",
                    "required": true
                },
                "place": {
                    "type": "list",
                    "required": true,
                    "validate_on_post": true
                },
                "description_text": {
                    "type": "string",
                    "required": false,
                    "show_in_embedded_editor": true
                },
                "internal_note": {
                    "type": "string",
                    "required": false
                }
            }
        }]
        """

    @auth
    @vocabulary
    Scenario: Event post validation failure
        When we post to "events"
        """
        [{
            "name": "Test Event",
            "calendars": [],
            "dates": {
                "start": "2029-11-21T01:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }

        }]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_error": {
                "message": [
                    "SLUGLINE is a required field",
                    "CALENDARS is a required field"
                ],
                "code": 400
            }
        }
        """
        When we patch "/events/#events._id#"
        """
        {
            "slugline": "Test slugger",
            "calendars": [{"qcode": "sport", "name": "Sport"}],
            "dates": {
                "start": "2029-11-21T01:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        Then we get OK response

    @auth
    @vocabulary
    Scenario: Post invalid series doesnt post any event in the series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T01:00:00.000Z",
                "end": "2099-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we patch "/events/#EVENT1._id#"
        """
        {
            "slugline": "Test slugger",
            "calendars": [{"qcode": "sport", "name": "Sport"}],
            "dates": {
                "start": "2029-11-21T01:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#EVENT1._id#",
            "etag": "#EVENT1._etag#",
            "pubstatus": "usable",
            "update_method": "all"
        }
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_error": {
                "message": [
                    "SLUGLINE is a required field",
                    "CALENDARS is a required field"
                ],
                "code": 400
            }
        }
        """
        When we get "events"
        Then we get list with 4 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "state": "draft",
            "pubstatus": "__no_value__"
        }, {
            "_id": "#EVENT2._id#",
            "state": "draft",
            "pubstatus": "__no_value__"
        }, {
            "_id": "#EVENT3._id#",
            "state": "draft",
            "pubstatus": "__no_value__"
        }, {
            "_id": "#EVENT4._id#",
            "state": "draft",
            "pubstatus": "__no_value__"
        }]}
        """
        When we patch "/events/#EVENT2._id#"
        """
        {
            "slugline": "Test slugger",
            "calendars": [{"qcode": "sport", "name": "Sport"}],
            "update_method": "all",
            "dates": {
                "start": "2029-11-21T01:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#EVENT1._id#",
            "etag": "#EVENT1._etag#",
            "pubstatus": "usable",
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "events"
        Then we get list with 4 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "state": "scheduled",
            "pubstatus": "usable"
        }, {
            "_id": "#EVENT2._id#",
            "state": "scheduled",
            "pubstatus": "usable"
        }, {
            "_id": "#EVENT3._id#",
            "state": "scheduled",
            "pubstatus": "usable"
        }, {
            "_id": "#EVENT4._id#",
            "state": "scheduled",
            "pubstatus": "usable"
        }]}
        """

    @auth
    Scenario: Planning post validation failure
        When we post to "planning"
        """
        {"internal_note": "Cant post me....", "planning_date": "2016-01-02"}
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {"planning": "#planning._id#", "etag": "#planning._etag#", "pubstatus": "usable"}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_error": {
                "message": ["PLACE is a required field"],
                "code": 400
            }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {"place": [{"qcode": "NSW"}], "planning_date": "2016-01-02"}
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {"planning": "#planning._id#", "etag": "#planning._etag#", "pubstatus": "usable"}
        """
        Then we get OK response

    @auth
    Scenario: Validate coverages
        Given "planning_types"
        """
        [
            {
                "name": "Text Coverage",
                "type": "coverage",
                "content_type": "text",
                "editor": {
                    "headline": {
                        "enabled": true
                    }
                },
                "schema": {
                    "headline": {
                        "required": true,
                        "validate_on_post": true
                    }
                }
            }
        ]
        """
        When we post to "planning"
        """
        {
            "planning_date": "2016-01-02",
            "coverages": [{
                "profile": "#planning_types._id#",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {"g2_content_type": "text"}
            }],
            "place": [{"qcode": "NSW"}]
        }
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {"planning": "#planning._id#", "etag": "#planning._etag#", "pubstatus": "usable"}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_error": {
                "message": ["HEADLINE is a required field"],
                "code": 400
            }
        }
        """

    @auth
    Scenario: Publishing related planning alongside event succeeds when show_in_embedded_editor is enabled
        Given the "planning_types"
        """
        [{
            "name": "event",
            "type": "event",
            "editor": {"related_plannings": {"enabled": true}},
            "schema": {
                "slugline": {
                    "type": "string",
                    "required": true,
                    "validate_on_post": true
                },
                "related_plannings": {
                    "planning_auto_publish": true
                }
            }
        }, {
            "name": "planning",
            "type": "planning",
            "editor": {
                "place": {"enabled": true},
                "description_text": {"enabled": true}
            },
            "schema": {
                "place": {
                    "type": "list",
                    "required": true,
                    "validate_on_post": true
                },
                "description_text": {
                    "type": "string",
                    "required": false,
                    "show_in_embedded_editor": true
                }
            }
        }]
        """
        When we post to "events"
        """
        [{
            "name": "Test Event",
            "slugline": "test-event",
            "dates": {
                "start": "2029-11-21T01:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "planning_date": "2029-11-21",
            "place": [{"qcode": "NSW"}],
            "related_events": [{"_id": "#events._id#", "link_type": "primary"}],
            "slugline": "test"
        }]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        Then we get updated response
        """
        {"failed_planning_ids": "__empty__"}
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"state": "scheduled", "pubstatus": "usable"}
        """
