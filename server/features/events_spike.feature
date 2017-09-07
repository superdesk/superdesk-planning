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
    Scenario: Spiking an Event also spikes associated Planning items
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
            "event_item": "#events._id#"
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
                "state": "draft"
            }, {
                "slugline": "TestPlan 2",
                "event_item": "#events._id#",
                "state": "draft"
            }]}
        """
        When we spike events "#events._id#"
        Then we get OK response
        When we get "/planning"
        Then we get list with 2 items
        """
            {"_items": [{
                "slugline": "TestPlan 1",
                "event_item": "#events._id#",
                "state": "spiked"
            }, {
                "slugline": "TestPlan 2",
                "event_item": "#events._id#",
                "state": "spiked"
            }]}
        """

    @auth
    Scenario: Unspiking an Event doesnt unspike associated Planning items
        Given "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-01",
                "end": "2017-01-01"
            },
            "state": "spiked",
            "revert_state": "draft"
        }]
        """
        Given "planning"
        """
        [{
            "slugline": "TestPlan 1",
            "event_item": "#events._id#",
            "state": "spiked"
        }, {
            "slugline": "TestPlan 2",
            "event_item": "#events._id#",
            "state": "spiked"
        }]
        """
        When we unspike events "#events._id#"
        Then we get OK response
        When we get "/planning"
        Then we get list with 2 items
        """
            {"_items": [{
                "slugline": "TestPlan 1",
                "event_item": "#events._id#",
                "state": "spiked"
            }, {
                "slugline": "TestPlan 2",
                "event_item": "#events._id#",
                "state": "spiked"
            }]}
        """

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