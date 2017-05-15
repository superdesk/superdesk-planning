Feature: Agenda

    @auth
    @notification
    Scenario: Update agendas when a planning is removed
        When we post to "planning"
        """
        [{
            "slugline": "planning 1"
        }]
        """
        Then we store "planningId" with value "#planning._id#" to context
        When we post to "agenda" with success
        """
        [{
            "planning_items": ["#planningId#"]
        }]
        """
        And we delete "/planning/#planningId#"
        Then we get response code 204
        When we get "/agenda"
        Then we get field planning_items exactly
        """
        []
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
        {"_issues": {"name": {"unique": 1}}, "_status": "ERR", "_message": "Agenda with name FOO already exists."}
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
        {"_issues": {"validator exception": "400: Agenda with name FOO already exists."}, "_status": "ERR"}
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
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning": 1, "planning_agenda_management": 0, "users": 1}}
        """
        Then we get OK response
        When we patch "/agenda/#agendaId#"
        """
        {"name": "bar"}
        """
        Then we get error 400
        """
        {"_status": "ERR", "_issues": {"validator exception": "403: Insufficient privileges to update agenda."}}
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
    Scenario: Planning item can be added to an agenda without planning_agenda_management privilege
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
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning": 1, "planning_agenda_management": 0, "users": 1}}
        """
        Then we get OK response
        When we patch "/agenda/#agendaId#"
        """
        {"planning_items": ["#planningId#"]}
        """
        Then we get OK response

    @auth
    Scenario: Creating Agenda will generate default metadata
        When we post to "agenda"
        """
        [{"name": "TestAgenda"}]
        """
        Then we get new resource
        """
        {
            "guid": "__any_value__",
            "name": "TestAgenda",
            "planning_type": "agenda",
            "original_creator": "#CONTEXT_USER_ID#"
        }
        """
