Feature: Planning Spike
    @auth
    Scenario: Planning state defaults to draft
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
            "state": "draft"
        }
        """

    @auth
    @notification
    Scenario: Spike a Planning item
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "draft"
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
            "state": "spiked",
            "revert_state": "draft"
        }
        """
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "planning_id": "#planning._id#",
            "operation": "spiked",
            "update": {"state" : "spiked", "revert_state": "draft"}}
            ]}
        """

    @auth
    @notification
    Scenario: Unspike a Planning item
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "spiked",
            "revert_state": "draft"
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
            "state": "draft"
        }
        """
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "planning_id": "#planning._id#",
            "operation": "unspiked",
            "update": {"state" : "draft"}}
        ]}
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
