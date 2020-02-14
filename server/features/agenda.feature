Feature: Agenda
    @auth
    @notification
    Scenario: Create an Agenda sends notification
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        Then we get OK response
        And we get existing resource
        """
        { "name": "TestAgenda", "is_enabled": true, "original_creator": "#CONTEXT_USER_ID#"}
        """
        And we get notifications
        """
        [{
            "event": "agenda:created",
            "extra": {
                "item": "#agenda._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Update an Agenda sends notification
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        Then we get OK response
        When we patch "/agenda/#agenda._id#"
        """
        {
            "name": "TestAgenda2"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "agenda:updated",
            "extra": {
                "item": "#agenda._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Agenda name should be unique name
        # Given "planning"
        When we post to "agenda"
        """
        [{"name": "foo"}]
        """
        Then we get OK response
        When we post to "agenda"
        """
        [{"name": "FOO"}]
        """
        Then we get error 400
        """
        {"_issues": {"name": {"unique": 1}}, "_status": "ERR"}
        """
        When we post to "agenda"
        """
        [{"name": "bar"}]
        """
        Then we get OK response
        When we patch "/agenda/#agenda._id#"
        """
        {"name": "FOO"}
        """
        Then we get error 400
        """
        {"_issues": {"name": {"unique": 1}}, "_status": "ERR"}
        """

    @auth
    Scenario: Agenda can be created only by user having privileges
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_agenda_management": 0, "users": 1}}
        """
        Then we get OK response
        When we post to "agenda"
        """
        [{"name": "foo"}]
        """
        Then we get error 403
        When we setup test user
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_agenda_management": 1, "users": 1}}
        """
        Then we get OK response
        When we post to "agenda"
        """
        [{"name": "foo"}]
        """
        Then we get OK response

    @auth
    Scenario: Agenda name can be modified only by user having privileges
        When we post to "agenda" with success
        """
        [{"name": "foo"}]
        """
        Then we store "agendaId" with value "#agenda._id#" to context
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning": 1, "planning_agenda_management": 0, "users": 1}}
        """
        Then we get OK response
        When we patch "/agenda/#agendaId#"
        """
        {"name": "bar"}
        """
        Then we get error 403
        """
        {"_message": "Insufficient privileges for the requested operation.", "_status": "ERR"}
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning": 1, "planning_agenda_management": 1, "users": 1}}
        """
        Then we get OK response
        When we patch "/agenda/#agendaId#"
        """
        {"name": "bar"}
        """
        Then we get OK response

    @auth
    @notification
    Scenario: Agenda name cannot be deleted if referenced by Planning Item
        When we post to "agenda"
        """
        [{"name": "foo"}]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "agendas": ["#agenda._id#"],
                "planning_date": "2016-01-02"
            }
        ]
        """
        Then we get OK response
        When we delete "/agenda/#agenda._id#"
        Then we get error 400
        """
        {"_message": "Agenda is referenced by Planning items. Cannot delete Agenda"}
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "agendas": []
        }
        """
        Then we get OK response
        When we reset notifications
        When we delete "/agenda/#agenda._id#"
        Then we get OK response
        Then we get notifications
        """
        [{
            "event": "agenda:deleted",
            "extra": {
                "item": "#agenda._id#"
            }
        }]
        """
