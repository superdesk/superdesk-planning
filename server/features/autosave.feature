Feature: Events Autosave

    @auth
    Scenario: Create a new Event Autosave
        Given we have sessions "/sessions"
        When we post to "event_autosave"
        """
        {
            "_id": "event1",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }
        """
        Then we get OK response
        When we get "/event_autosave/#event_autosave._id#"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }
        """

    @auth
    Scenario: Delete Event Autosaves on session end
        Given we have sessions "/sessions"
        Given "event_autosave"
        """
        [{
            "_id": "event1",
            "slugline": "Test Event 1",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }, {
            "_id": "event2",
            "slugline": "Test Event 2",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "session2",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }, {
            "_id": "event3",
            "slugline": "Test Event 3",
            "lock_user": "ident2",
            "lock_session": "session3",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }]
        """
        Given I logout
        When we login as user "foo" with password "bar" and user type "admin"
        """
        {"user_type": "user", "email": "foo.bar@foobar.org"}
        """
        When we get "/event_autosave"
        Then we get list with 2 items
        """
        {"_items": [{"_id": "event2"}, {"_id": "event3"}]}
        """

    @auth
    Scenario: Delete Planning Autosaves on session end
        Given we have sessions "/sessions"
        Given "planning_autosave"
        """
        [{
            "_id": "plan1",
            "slugline": "Test Plan 1",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }, {
            "_id": "plan2",
            "slugline": "Test Plan 2",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "session2",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }, {
            "_id": "plan3",
            "slugline": "Test Plan 3",
            "lock_user": "ident2",
            "lock_session": "session3",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }]
        """
        Given I logout
        When we login as user "foo" with password "bar" and user type "admin"
        """
        {"user_type": "user", "email": "foo.bar@foobar.org"}
        """
        When we get "/planning_autosave"
        Then we get list with 2 items
        """
        {"_items": [{"_id": "plan2"}, {"_id": "plan3"}]}
        """

    @auth
    Scenario: Fails to create a new Event Autosave if user or session not supplied
        Given we have sessions "/sessions"
        When we post to "event_autosave"
        """
        {
            "_id": "event1",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_message": "Autosave failed, User Session not supplied"
        }
        """
        When we post to "event_autosave"
        """
        {
            "_id": "event1",
            "slugline": "Test Event",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_message": "Autosave failed, User not supplied"
        }
        """
