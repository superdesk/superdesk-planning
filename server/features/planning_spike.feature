Feature: Planning Spike
    @auth
    Scenario: Planning state defaults to active
        When we post to "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "state": "active"
        }
        """

    @auth
    @notification
    Scenario: Spike a Planning item
        Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we spike planning "#planning._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:spike",
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

    @auth
    @notification
    Scenario: Unspike a Planning item
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "spiked"
        }]
        """
        When we unspike planning "#planning._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:unspike",
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

    @auth
    Scenario: Planning item can be spiked and unspiked only by user having privileges
        Given "planning"
        """
        [{
            "slugline": "TestPlan"
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
