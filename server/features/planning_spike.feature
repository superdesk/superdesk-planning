Feature: Planning Spike
    @auth
    Scenario: Planning state defaults to active
        When we post to "agenda" with "agenda1" and success
        """
        [{"name": "foo1"}]
        """
        When we post to "planning"
        """
        [{
            "slugline": "TestPlan", "agendas": ["#agenda1#"]
        }]
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "agendas": ["#agenda1#"],
            "state": "active"
        }
        """

    @auth
    @notification
    Scenario: Spike a Planning item
        Given "agenda"
        """
        [{"_id": "foo", "name": "foo", "is_enabled": true}]
        """
        Given "planning"
        """
        [{
            "slugline": "TestPlan", "agendas": ["foo"]
        }]
        """
        When we spike planning "#planning._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:spiked",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "state": "spiked"
        }
        """
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "planning_id": "#planning._id#",
            "operation": "spiked",
            "update": {"state" : "spiked"}
        }]}
        """

    @auth
    @notification
    Scenario: Unspike a Planning item
        Given "agenda"
        """
        [{"_id": "foo", "name": "foo", "is_enabled": true}]
        """
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "spiked",
            "agendas": ["foo"]
        }]
        """
        When we unspike planning "#planning._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:unspiked",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "state": "active"
        }
        """
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "planning_id": "#planning._id#",
            "operation": "unspiked",
            "update": {"state" : "active"}
        }]}
        """

    @auth
    Scenario: Planning item can be spiked and unspiked only by user having privileges
        Given "agenda"
        """
        [{"_id": "foo", "name": "foo", "is_enabled": true}]
        """
        Given "planning"
        """
        [{
            "slugline": "TestPlan", "agendas": ["foo"]
        }]
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_planning_spike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike planning "#planning._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_planning_spike": 1,
                "planning_planning_unspike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike planning "#planning._id#"
        Then we get OK response
        When we unspike planning "#planning._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_planning_unspike": 1,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we unspike planning "#planning._id#"
        Then we get OK response
