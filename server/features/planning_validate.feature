Feature: Planning Validate
    Background: Initial Setup
        Given the "planning_types"
        """
        [{
            "_id": "event", "name": "event",
            "schema": {
                "slugline": {
                    "type": "string",
                    "required": true,
                    "validate_on_publish": true
                },
                "name": {
                    "type": "string",
                    "required": true
                },
                "calendars": {
                    "type": "list",
                    "required": true,
                    "validate_on_publish": true
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
            "_id": "planning", "name": "planning",
            "schema": {
                "slugline": {
                    "type": "string",
                    "required": true
                },
                "place": {
                    "type": "list",
                    "required": true,
                    "validate_on_publish": true
                },
                "description_text": {
                    "type": "string",
                    "required": false
                },
                "internal_note": {
                    "type": "string",
                    "required": false
                }
            }
        }]
        """

    @auth
    Scenario: Event publish validation failure
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
        When we post to "/events/publish"
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
            "calendars": [{"qcode": "cal1", "name": "Calendar 1"}]
        }
        """
        Then we get OK response
        When we post to "/events/publish"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        Then we get OK response

    @auth
    Scenario: Publish invalid series doesnt publish any event in the series
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
            "calendars": [{"qcode": "cal1", "name": "Calendar 1"}]
        }
        """
        Then we get OK response
        When we post to "/events/publish"
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
            "calendars": [{"qcode": "cal1", "name": "Calendar 1"}],
            "update_method": "all"
        }
        """
        Then we get OK response
        When we post to "/events/publish"
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
    Scenario: Planning publish validation failure
        When we post to "planning"
        """
        {"internal_note": "Cant publish me...."}
        """
        Then we get OK response
        When we post to "/planning/publish"
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
        {"place": [{"qcode": "NSW"}]}
        """
        Then we get OK response
        When we post to "/planning/publish"
        """
        {"planning": "#planning._id#", "etag": "#planning._etag#", "pubstatus": "usable"}
        """
        Then we get OK response

