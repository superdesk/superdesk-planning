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

    @auth
    Scenario: Spike planning is recorded in agenda history
        When we post to "planning"
        """
        [{"slugline": "slugger"}]
        """
        Then we get OK response
        Then we store "planningId" with value "#planning._id#" to context
        When we post to "agenda" with success
        """
        [{"name": "foo"}]
        """
        Then we store "agendaId" with value "#agenda._id#" to context
        Then we get OK response
        When we patch "/agenda/#agendaId#"
        """
        {"planning_items": ["#planningId#"]}
        """
        Then we get OK response
        When we spike planning "#planningId#"
        Then we get OK response
        When we get "/planning_history?where=planning_id==%22#planningId#%22"
        Then we get list with 2 items
        """
        {"_items": [{
            "planning_id": "#planning._id#",
            "operation": "create",
            "update": {"state" : "active"}
        },{
            "planning_id": "#planning._id#",
            "operation": "spiked",
            "update": {"state" : "spiked"}
        }]}
        """
        When we get "/agenda_history?where=agenda_id==%22#agendaId#%22"
        Then we get list with 3 items
        """
        {"_items": [{
            "operation" : "item spiked",
                "update" : {
                "planning_items" : "#planningId#"}
        }]}
        """
        Then we get OK response
        When we unspike planning "#planningId#"
        Then we get OK response
        When we get "/agenda_history?where=agenda_id==%22#agendaId#%22"
        Then we get list with 4 items
        """
        {"_items": [{
            "operation" : "item unspiked",
                "update" : {
                "planning_items" : "#planningId#"}
        }]}
        """
        Then we get OK response
