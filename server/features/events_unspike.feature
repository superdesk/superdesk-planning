Feature: Events Unspike

    @auth
    @notification
    Scenario: Unspike an Event
        Given "events"
        """
        [{
            "name": "TestEvent",
            "state": "spiked",
            "revert_state": "draft",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        When we unspike events "#events._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:unspiked",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#",
                "unspiked_items": [{
                    "id": "#events._id#",
                    "etag": "__any_value__",
                    "state": "draft"
                }]
            }
        }]
        """
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "name": "TestEvent",
            "state": "draft"
        }
        """
        When we get "/events_history"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_id": "#events._id#",
            "operation": "unspiked",
            "update": {"state" : "draft"}
        }]}
        """

    @auth
    Scenario: Unspiking a single event in a series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        And we store "EVENT4" with 4 item
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT2._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT3._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT4._id#", "state": "spiked", "revert_state": "draft"}
        ]}
        """
        When we unspike events "#EVENT2._id#"
        """
        {"update_method": "single"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT2._id#", "state": "draft"},
            {"_id": "#EVENT3._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT4._id#", "state": "spiked", "revert_state": "draft"}
        ]}
        """
        When we get "/events_history"
        Then we get list with 9 items
        """
        {"_items": [
            {"event_id": "#EVENT1._id#", "operation": "create"},
            {"event_id": "#EVENT2._id#", "operation": "create"},
            {"event_id": "#EVENT3._id#", "operation": "create"},
            {"event_id": "#EVENT4._id#", "operation": "create"},
            {"event_id": "#EVENT1._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT2._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT3._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT4._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT2._id#", "operation": "unspiked", "update": {"state": "draft"}}
        ]}
        """

    @auth
    @notification
    Scenario: Unspiking a series of Events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        And we store "EVENT4" with 4 item
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT2._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT3._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT4._id#", "state": "spiked", "revert_state": "draft"}
        ]}
        """
        When we unspike events "#EVENT2._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {"item": "#EVENT1.recurrence_id#", "user": "#CONTEXT_USER_ID#"}
        }, {
            "event": "events:spiked",
            "extra": {"item": "#EVENT1._id#", "user": "#CONTEXT_USER_ID#"}
        }, {
            "event": "events:unspiked",
            "extra": {
                "item": "#EVENT2._id#",
                "user": "#CONTEXT_USER_ID#",
                "unspiked_items": [
                    {"id": "#EVENT1._id#", "etag": "__any_value__", "state": "draft"},
                    {"id": "#EVENT2._id#", "etag": "__any_value__", "state": "draft"},
                    {"id": "#EVENT3._id#", "etag": "__any_value__", "state": "draft"},
                    {"id": "#EVENT4._id#", "etag": "__any_value__", "state": "draft"}
                ]
            }
        }]
        """
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "state": "draft"},
            {"_id": "#EVENT2._id#", "state": "draft"},
            {"_id": "#EVENT3._id#", "state": "draft"},
            {"_id": "#EVENT4._id#", "state": "draft"}
        ]}
        """
        When we get "/events_history"
        Then we get list with 12 items
        """
        {"_items": [
            {"event_id": "#EVENT1._id#", "operation": "create"},
            {"event_id": "#EVENT2._id#", "operation": "create"},
            {"event_id": "#EVENT3._id#", "operation": "create"},
            {"event_id": "#EVENT4._id#", "operation": "create"},
            {"event_id": "#EVENT1._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT2._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT3._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT4._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT1._id#", "operation": "unspiked", "update": {"state": "draft"}},
            {"event_id": "#EVENT2._id#", "operation": "unspiked", "update": {"state": "draft"}},
            {"event_id": "#EVENT3._id#", "operation": "unspiked", "update": {"state": "draft"}},
            {"event_id": "#EVENT4._id#", "operation": "unspiked", "update": {"state": "draft"}}
        ]}
        """

    @auth
    Scenario: Unspiking all future events in a series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        And we store "EVENT4" with 4 item
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT2._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT3._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT4._id#", "state": "spiked", "revert_state": "draft"}
        ]}
        """
        When we unspike events "#EVENT3._id#"
        """
        {"update_method": "future"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "state": "spiked"},
            {"_id": "#EVENT2._id#", "state": "spiked"},
            {"_id": "#EVENT3._id#", "state": "draft"},
            {"_id": "#EVENT4._id#", "state": "draft"}
        ]}
        """
        When we get "/events_history"
        Then we get list with 10 items
        """
        {"_items": [
            {"event_id": "#EVENT1._id#", "operation": "create"},
            {"event_id": "#EVENT2._id#", "operation": "create"},
            {"event_id": "#EVENT3._id#", "operation": "create"},
            {"event_id": "#EVENT4._id#", "operation": "create"},
            {"event_id": "#EVENT1._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT2._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT3._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT4._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT3._id#", "operation": "unspiked", "update": {"state": "draft"}},
            {"event_id": "#EVENT4._id#", "operation": "unspiked", "update": {"state": "draft"}}
        ]}
        """

    @auth
    @vocabulary
    @wip
    Scenario: Unspiking restores original state
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 5,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        And we store "EVENT4" with 4 item
        And we store "EVENT5" with 5 item
        When we post to "/events/#EVENT3._id#/lock" with success
        """
        {"lock_action": "postpone"}
        """
        When we perform postpone on events "#EVENT3._id#"
        Then we get OK response
        When we post to "/events/#EVENT4._id#/lock" with success
        """
        {"lock_action": "cancel"}
        """
        When we perform cancel on events "#EVENT4._id#"
        Then we get OK response
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 5 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT2._id#", "state": "spiked", "revert_state": "draft"},
            {"_id": "#EVENT3._id#", "state": "spiked", "revert_state": "postponed"},
            {"_id": "#EVENT4._id#", "state": "spiked", "revert_state": "cancelled"},
            {"_id": "#EVENT5._id#", "state": "spiked", "revert_state": "draft"}
        ]}
        """
        When we unspike events "#EVENT2._id#"
        """
        {"update_method": "future"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 5 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "state": "spiked"},
            {"_id": "#EVENT2._id#", "state": "draft"},
            {"_id": "#EVENT3._id#", "state": "postponed"},
            {"_id": "#EVENT4._id#", "state": "cancelled"},
            {"_id": "#EVENT5._id#", "state": "draft"}
        ]}
        """
        When we get "/events_history"
        Then we get list with 16 items
        """
        {"_items": [
            {"event_id": "#EVENT1._id#", "operation": "create"},
            {"event_id": "#EVENT2._id#", "operation": "create"},
            {"event_id": "#EVENT3._id#", "operation": "create"},
            {"event_id": "#EVENT4._id#", "operation": "create"},
            {"event_id": "#EVENT5._id#", "operation": "create"},

            {"event_id": "#EVENT1._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT2._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},
            {"event_id": "#EVENT3._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "postponed"}},
            {"event_id": "#EVENT4._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "cancelled"}},
            {"event_id": "#EVENT5._id#", "operation": "spiked", "update": {"state": "spiked", "revert_state": "draft"}},

            {"event_id": "#EVENT3._id#", "operation": "postpone", "update": {"state": "postponed"}},
            {"event_id": "#EVENT4._id#", "operation": "cancel", "update": {"state": "cancelled"}},

            {"event_id": "#EVENT2._id#", "operation": "unspiked", "update": {"state": "draft"}},
            {"event_id": "#EVENT3._id#", "operation": "unspiked", "update": {"state": "postponed"}},
            {"event_id": "#EVENT4._id#", "operation": "unspiked", "update": {"state": "cancelled"}},
            {"event_id": "#EVENT5._id#", "operation": "unspiked", "update": {"state": "draft"}}
        ]}
        """
