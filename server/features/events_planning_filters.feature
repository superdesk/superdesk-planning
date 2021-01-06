Feature: Events And Planing View Filters
    @auth
    @notification
    Scenario: Create an Events And Planning View filter sends notification
        When we post to "events_planning_filters"
        """
        [{
            "name": "Test",
            "item_type": "combined",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }]
        """
        Then we get OK response
        And we get existing resource
        """
        {
            "name": "Test",
            "item_type": "combined",
            "original_creator": "#CONTEXT_USER_ID#",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }
        """
        And we get notifications
        """
        [{
            "event": "event_planning_filters:created",
            "extra": {
                "item": "#events_planning_filters._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Update an Events And Planning View filter sends notification
        When we post to "events_planning_filters"
        """
        [{
            "name": "Test",
            "item_type": "combined",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }]
        """
        Then we get OK response
        And we get existing resource
        """
        {
            "name": "Test",
            "item_type": "combined",
            "original_creator": "#CONTEXT_USER_ID#",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }
        """
        When we patch "events_planning_filters/#events_planning_filters._id#"
        """
        {
            "name": "Test2"
        }
        """
        Then we get OK response
        And we get existing resource
        """
        {
            "name": "Test2",
            "item_type": "combined",
            "original_creator": "#CONTEXT_USER_ID#",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }
        """
        And we get notifications
        """
        [{
            "event": "event_planning_filters:updated",
            "extra": {
                "item": "#events_planning_filters._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Delete an Events And Planning View filter sends notification
        When we post to "events_planning_filters"
        """
        [{
            "name": "Test",
            "item_type": "combined",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }]
        """
        Then we get OK response
        And we get existing resource
        """
        {
            "name": "Test",
            "item_type": "combined",
            "original_creator": "#CONTEXT_USER_ID#",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }
        """
        When we delete "events_planning_filters/#events_planning_filters._id#"
        Then we get OK response
        When we get "events_planning_filters/#events_planning_filters._id#"
        Then we get error 404
        And we get notifications
        """
        [{
            "event": "event_planning_filters:deleted",
            "extra": {
                "item": "#events_planning_filters._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Events Planning Filter name should be unique name
        Given "events_planning_filters"
        """
        [{
            "name": "Foo",
            "item_type": "combined",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }]
        """
        When we post to "events_planning_filters"
        """
        {
            "name": "FOO",
            "item_type": "combined",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"name": {"unique": 1}}, "_status": "ERR"}
        """
        When we post to "events_planning_filters"
        """
        {
            "name": "Bar",
            "item_type": "combined",
            "params": {
                "calendars": [{"name": "finance", "qcode": "finance"}],
                "agendas": []
            }
        }
        """
        Then we get OK response
        When we patch "/events_planning_filters/#events_planning_filters._id#"
        """
        {"name": "Foo"}
        """
        Then we get error 400
        """
        {"_issues": {"name": {"unique": 1}}, "_status": "ERR"}
        """

    @auth
    Scenario: Events Planning Filter can be created only by user having privileges
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_eventsplanning_filters_management": 0, "users": 1}}
        """
        Then we get OK response
        When we post to "events_planning_filters"
        """
         [
            {
                "name": "Foo",
                "item_type": "combined",
                "params": {
                    "calendars": [{"name": "finance", "qcode": "finance"}],
                    "agendas": []
                }
            }
         ]
        """
        Then we get error 403
        When we setup test user
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_eventsplanning_filters_management": 1, "users": 1}}
        """
        Then we get OK response
        When we post to "events_planning_filters"
        """
         [
            {
                "name": "Foo",
                "item_type": "combined",
                "params": {
                    "calendars": [{"name": "finance", "qcode": "finance"}],
                    "agendas": []
                }
            }
         ]
        """
        Then we get OK response

    @auth
    Scenario: Events Planning Filter can be modified only by user having privileges
        When we post to "events_planning_filters"
        """
         [
            {
                "name": "Foo",
                "item_type": "combined",
                "params": {
                    "calendars": [{"name": "finance", "qcode": "finance"}],
                    "agendas": []
                }
            }
         ]
        """
        Then we get OK response
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_eventsplanning_filters_management": 0, "users": 1}}
        """
        Then we get OK response
        When we patch "/events_planning_filters/#events_planning_filters._id#"
        """
        {"name": "bar"}
        """
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_eventsplanning_filters_management": 1, "users": 1}}
        """
        Then we get OK response
        When we patch "/events_planning_filters/#events_planning_filters._id#"
        """
        {"name": "bar"}
        """
        Then we get OK response
