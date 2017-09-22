Feature: Events Spike
    @auth
    Scenario: Event state defaults to draft
        When we post to "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "name": "TestEvent",
            "state": "draft"
        }
        """

    @auth
    @notification
    Scenario: Spike an Event
        Given "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        When we spike events "#events._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:spiked",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "name": "TestEvent",
            "state": "spiked"
        }
        """
        When we get "/events_history?where=event_id==%22#events._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_id": "#events._id#",
            "operation": "spiked",
            "update": {"state" : "spiked"}
        }]}
        """

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
                "user": "#CONTEXT_USER_ID#"
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
        When we get "/events_history?where=event_id==%22#events._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_id": "#events._id#",
            "operation": "unspiked",
            "update": {"state" : "draft"}
        }]}
        """

    @auth
    Scenario: Event can be spiked and unspiked only by user having privileges
        Given "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_event_spike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike events "#events._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_event_spike": 1,
                "planning_event_unspike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike events "#events._id#"
        Then we get OK response
        When we unspike events "#events._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_event_unspike": 1,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we unspike events "#events._id#"
        Then we get OK response

    @auth
    Scenario: Spiking an Event fails if an associated Planning items is locked
        Given "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-01",
                "end": "2017-01-01"
            }
        }]
        """
        Given "planning"
        """
        [{
            "slugline": "TestPlan 1",
            "event_item": "#events._id#",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "123"
        }, {
            "slugline": "TestPlan 2",
            "event_item": "#events._id#"
        }]
        """
        When we get "/planning"
        Then we get list with 2 items
        """
            {"_items": [{
                "slugline": "TestPlan 1",
                "event_item": "#events._id#",
                "state": "draft",
                "lock_user": "#CONTEXT_USER_ID#",
                "lock_session": "123"
            }, {
                "slugline": "TestPlan 2",
                "event_item": "#events._id#",
                "state": "draft"
            }]}
        """
        When we spike events "#events._id#"
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "403: Spike failed. One or more related planning items are locked."
            }
        }
        """

    @auth
    @notification
    Scenario: Spiking a locked event unlocks the event after spiking it
        Given "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "session123"
        }]
        """
        When we spike events "#events._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:spiked",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "name": "TestEvent",
            "state": "spiked",
            "lock_user": null,
            "lock_session": null
        }
        """
        When we get "/events_history?where=event_id==%22#events._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_id": "#events._id#",
            "operation": "spiked",
            "update": {"state" : "spiked"}
        }]}
        """

    @auth
    Scenario: Spiking an Event fails if an Event or Planning item in the series is locked
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
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        When we post to "/planning"
        """
        [{
            "slugline": "Friday Club",
            "headline": "First Meeting",
            "event_item": "#EVENT2._id#"
        }]
        """
        Then we get OK response
        When we post to "/events/#EVENT3._id#/lock"
        """
        {"lock_action": "edit"}
        """
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "403: Spike failed. An event in the series is locked."
            }
        }
        """
        When we post to "/events/#EVENT3._id#/unlock"
        """
        {}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "403: Spike failed. A related planning item is locked."
            }
        }
        """
        When we post to "/planning/#planning._id#/unlock"
        """
        {}
        """
        Then we get OK response
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response

    @auth
    Scenario: Spiking a series of Events only spiked Events not in use
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
        When we post to "/planning"
        """
        [{
            "slugline": "Friday Club",
            "headline": "First Meeting",
            "event_item": "#EVENT2._id#"
        }]
        """
        When we post to "/events/publish"
        """
        {"event": "#EVENT4._id#", "etag": "#EVENT4._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "state": "spiked",
                "revert_state": "draft"
            },
            {
                "_id": "#EVENT2._id#",
                "state": "draft"
            },
            {
                "_id": "#EVENT3._id#",
                "state": "spiked",
                "revert_state": "draft"
            },
            {
                "_id": "#EVENT4._id#",
                "state": "scheduled"
            }
        ]}
        """