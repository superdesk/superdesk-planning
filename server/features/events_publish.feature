Feature: Events Publish

    @auth
    @notification
    Scenario: Publish all events in a series of recurring events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-21T23:00:00.000Z",
                "end": "2029-11-22T02:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            },
            "state": "draft"
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we post to "/events/publish"
        """
        {
            "event": "#EVENT2._id#",
            "etag": "#EVENT2._etag#",
            "pubstatus": "usable",
            "update_method": "all"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:published:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "state": "scheduled",
                "pubstatus": "usable",
                "items": [{
                    "id": "#EVENT1._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT2._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT3._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT4._id#",
                    "etag": "__any_value__"
                }]
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 8 items
        """
        {"_items": [{
            "event_id": "#EVENT1._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT1._id#",
            "operation": "publish",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "publish",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "publish",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "publish",
            "update": {"state": "scheduled"}
        }]}
        """

    @auth
    @notification
    Scenario: Publish all future events in a series of recurring events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-21T23:00:00.000Z",
                "end": "2029-11-22T02:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            },
            "state": "draft"
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we post to "/events/publish"
        """
        {
            "event": "#EVENT2._id#",
            "etag": "#EVENT2._etag#",
            "pubstatus": "usable",
            "update_method": "future"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:published:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "state": "scheduled",
                "pubstatus": "usable",
                "items": [{
                    "id": "#EVENT2._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT3._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT4._id#",
                    "etag": "__any_value__"
                }]
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 7 items
        """
        {"_items": [{
            "event_id": "#EVENT1._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "publish",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "publish",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "publish",
            "update": {"state": "scheduled"}
        }]}
        """

    @auth
    @notification
    Scenario: Publish single event from a series of recurring events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-21T23:00:00.000Z",
                "end": "2029-11-22T02:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            },
            "state": "draft"
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we post to "/events/publish"
        """
        {
            "event": "#EVENT2._id#",
            "etag": "#EVENT2._etag#",
            "pubstatus": "usable",
            "update_method": "single"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:published",
            "extra": {
                "item": "#EVENT2._id#",
                "state": "scheduled",
                "pubstatus": "usable"
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 5 items
        """
        {"_items": [{
            "event_id": "#EVENT1._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "publish",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "create"
        }]}
        """
