Feature: Events Spike
    @auth
    Scenario: Event state defaults to active
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
            "state": "active"
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
            "state": "active"
        }
        """
        When we get "/events_history?where=event_id==%22#events._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_id": "#events._id#",
            "operation": "unspiked",
            "update": {"state" : "active"}
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
                "state": "active"
            }, {
                "slugline": "TestPlan 2",
                "event_item": "#events._id#",
                "state": "active"
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
            "state": "spiked"
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
