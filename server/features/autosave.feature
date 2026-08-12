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
            "lock_time": "2018-06-01T05:19:02+0000"
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
            "lock_time": "2018-06-01T05:19:02+0000"
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
            "lock_time": "2018-06-01T05:19:02+0000"
        }, {
            "_id": "event2",
            "slugline": "Test Event 2",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "2822e25fc5be08b7cdb27490",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000"
        }, {
            "_id": "event3",
            "slugline": "Test Event 3",
            "lock_user": "3822e25fc5be08b7cdb27490",
            "lock_session": "2822e25fc5be08b7cdb27491",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000"
        }]
        """
        Given I logout
        When we login as user "foo" with password "barword" and user type "admin"
        """
        {"user_type": "user", "email": "foo.bar@foobar.org"}
        """
        When we get "/event_autosave"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event3"}]}
        """

    @auth
    Scenario: Deletes new associated file when autosave is deleted
        Given we have sessions "/sessions"
        When we upload a file "bike.jpg" to "/events_files"
        Then we get an event file reference
        When we get "events_files/"
        Then we get list with 1 items
        """
        {"_items": [{ "_id": "#events_files._id#" }]}
        """
        When we post to "event_autosave"
        """
        {
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": ["#events_files._id#"]

        }
        """
        Then we get OK response
        When we get "/event_autosave/#event_autosave._id#"
        Then we get existing resource
        """
        {
            "_id": "#event_autosave._id#",
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": ["#events_files._id#"]
        }
        """
        When we delete "/event_autosave/#event_autosave._id#"
        Then we get OK response
        When we get "events_files/"
        Then we get list with 0 items
        """
        {"_items": []}
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
            "lock_time": "2018-06-01T05:19:02+0000"
        }, {
            "_id": "plan2",
            "slugline": "Test Plan 2",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "2822e25fc5be08b7cdb27490",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000"
        }, {
            "_id": "plan3",
            "slugline": "Test Plan 3",
            "lock_user": "3822e25fc5be08b7cdb27490",
            "lock_session": "2822e25fc5be08b7cdb27491",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000"
        }]
        """
        Given I logout
        When we login as user "foo" with password "barword" and user type "admin"
        """
        {"user_type": "user", "email": "foo.bar@foobar.org"}
        """
        When we get "/planning_autosave"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "plan3"}]}
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
            "lock_time": "2018-06-01T05:19:02+0000"
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
            "lock_time": "2018-06-01T05:19:02+0000"
        }
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_message": "Autosave failed, User not supplied"
        }
        """

    @auth
    Scenario: Event autosave is removed on event unlock
        Given we have sessions "/sessions"
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "state": "draft",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }]
        """
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
        Then we get OK response
        When we post to "planning/#events._id#/unlock"
        """
        {}
        """
        Then we get OK response
        When we get "/event_autosave/#event_autosave._id#"
        Then we get error 404

    @auth
    Scenario: Planning autosave is removed on planning unlock
        Given we have sessions "/sessions"
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "name": "TestPlan",
            "planning_date": "2029-11-21T12:00:00.000Z",
            "state": "draft",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }]
        """
        When we post to "planning_autosave"
        """
        {
            "_id": "plan1",
            "slugline": "Test Plan",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }
        """
        Then we get OK response
        When we get "/planning_autosave/#planning_autosave._id#"
        Then we get OK response
        When we post to "/planning/#planning._id#/unlock"
        """
        {}
        """
        Then we get OK response
        When we get "/planning_autosave/#planning_autosave._id#"
        Then we get error 404
