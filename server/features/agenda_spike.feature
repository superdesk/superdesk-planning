Feature: Agenda Spike
    @auth
    Scenario: Agenda state defaults to active
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        Then we get OK response
        When we get "/agenda/#agenda._id#"
        Then we get existing resource
        """
        {
            "_id": "#agenda._id#",
            "name": "TestAgenda",
            "state": "active"
        }
        """

    @auth
    @notification
    Scenario: Spike an Agenda
        Given "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        When we spike agenda "#agenda._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "agenda:spiked",
            "extra": {
                "item": "#agenda._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/agenda/#agenda._id#"
        Then we get existing resource
        """
        {
            "_id": "#agenda._id#",
            "name": "TestAgenda",
            "state": "spiked"
        }
        """
        When we get "/agenda_history?where=agenda_id==%22#agenda._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "agenda_id": "#agenda._id#",
            "operation": "spiked",
            "update": {"state" : "spiked"}
        }]}
        """

    @auth
    @notification
    Scenario: Unspike an Agenda
        Given "agenda"
        """
        [{
            "name": "TestAgenda",
            "state": "spiked"
        }]
        """
        When we unspike agenda "#agenda._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "agenda:unspiked",
            "extra": {
                "item": "#agenda._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/agenda/#agenda._id#"
        Then we get existing resource
        """
        {
            "_id": "#agenda._id#",
            "name": "TestAgenda",
            "state": "active"
        }
        """
        When we get "/agenda_history?where=agenda_id==%22#agenda._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "agenda_id": "#agenda._id#",
            "operation": "unspiked",
            "update": {"state" : "active"}
        }]}
        """

    @auth
    Scenario: Agenda can be spiked and unspiked only by user having privileges
        Given "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_agenda_spike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike agenda "#agenda._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_agenda_spike": 1,
                "planning_agenda_unspike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike agenda "#agenda._id#"
        Then we get OK response
        When we unspike agenda "#agenda._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_agenda_unspike": 1,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we unspike agenda "#agenda._id#"
        Then we get OK response
