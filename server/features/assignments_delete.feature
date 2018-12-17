Feature: Assignments Delete
    Background: Initial setup
        Given we have sessions "/sessions"
        Given the "validators"
        """
        [{
            "schema": {},
            "type": "text",
            "act": "publish",
            "_id": "publish_text"
        },
        {
            "_id": "publish_composite",
            "act": "publish",
            "type": "composite",
            "schema": {}
        }]
        """
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type" : "text"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store coverage id in "coverageId" from coverage 0
        Then we store assignment id in "assignmentId" from coverage 0

    @auth
    @notification
    Scenario: Cannot delete an Assignment without Assignment and Planning locks
        When we delete "/assignments/#assignmentId#"
        Then we get error 403
        When we post to "/assignments/#assignmentId#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we delete "/assignments/#assignmentId#"
        Then we get error 403
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we reset notifications
        When we delete "/assignments/#assignmentId#"
        Then we get OK response
        When we get "/assignments/#assignmentId#"
        Then we get error 404
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "lock_user": "__none__",
            "lock_session": "__none__",
            "lock_action": "__none__",
            "lock_time": "__none__",
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
                },
                "assigned_to": {
                    "desk": "__no_value__",
                    "user": "__no_value__"
                },
                "workflow_status": "draft"
            }]
        }
        """
        Then we get notifications
        """
        [{
            "event": "assignments:removed",
            "extra": {
                "assignment": "#assignmentId#",
                "planning": "#planning._id#",
                "coverage": "#coverageId#",
                "planning_etag": "__any_value__"
            }
        }]
        """

    @auth
    Scenario: Deleting an Assignment removes the assignment id from the Archive item
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        When we post to "assignments/link"
        """
        [{"assignment_id": "#assignmentId#", "item_id": "#archive._id#", "reassign": true}]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#assignmentId#"}
        """
        When we post to "/assignments/#assignmentId#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we delete "/assignments/#assignmentId#"
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "__none__"}
        """
        When we get "/activity"
        Then we get existing resource
        """
        {"_items": [
           {
                    "data" : {
                    "slugline" : "test slugline",
                    "coverage_type" : "text"
                    },
                    "message" : "The {{coverage_type}} assignment {{slugline}} has been removed",
                    "name":"update",
                    "recipients":[
                       {
                          "user_id":"#CONTEXT_USER_ID#",
                          "read":false
                       }
                    ],
                    "resource":"assignments",
                    "user":"#CONTEXT_USER_ID#",
                    "user_name":"test_user"
                 }
        ]}
        """

    @auth
    Scenario: Locks must be held by the current user in the current session
        When we post to "/assignments/#assignmentId#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we switch user
        When we delete "/assignments/#assignmentId#"
        Then we get error 403

    @auth
    Scenario: Cannot delete assignment if archive item has lock conflict
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "sign_off": "abc"}
        """
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        When we post to "assignments/link"
        """
        [{"assignment_id": "#assignmentId#", "item_id": "#archive._id#", "reassign": true}]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#assignmentId#"}
        """
        When we post to "/assignments/#assignmentId#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        When we patch "/archive/#archive._id#"
        """
        {"lock_user": "#users._id#"}
        """
        Then we get OK response
        When we delete "/assignments/#assignmentId#"
        Then we get error 403
        """
        {"_message": "Associated archive item is locked"}
        """

    @auth
    Scenario: Lock validation passes if associated event is locked instead of planning
        Given we have sessions "/sessions"
        Given "events"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "location": [{"qcode": "test qcaode", "name": "test name"}],
                "lock_user": "#CONTEXT_USER_ID#",
                "lock_session": "#SESSION_ID#"
            }
        ]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "coverage_id": "#coverageId#",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
                },
                "assigned_to": {
                    "assignment_is": "#assignmentId#",
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "assigned"
                },
                "workflow_status": "active"
            }],
            "event_item": "#events._id#"
        }
        """
        Then we get OK response
        When we post to "/assignments/#assignmentId#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        When we delete "/assignments/#assignmentId#"
        Then we get OK response

    @auth
    Scenario: Lock validation passes if any recurring entity is locked
        Given we have sessions "/sessions"
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "coverage_id": "#coverageId#",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
                },
                "assigned_to": {
                    "assignment_is": "#assignmentId#",
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "assigned"
                },
                "workflow_status": "active"
            }],
            "event_item": "#EVENT2._id#",
            "recurrence_id": "#EVENT2.recurrence_id#"
        }
        """
        When we post to "/events/#EVENT1._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get OK response
        When we post to "/assignments/#assignmentId#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        When we delete "/assignments/#assignmentId#"
        Then we get OK response

    @auth
    Scenario: No Lock validation passes if planning item is spiked
        When we spike planning "#planning._id#"
        Then we get OK response
        When we get "/assignments/"
        Then we get list with 0 items

    @auth
    Scenario: No Lock validation passes if planning item is killed
        When we post to "planning/#planning._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        When we get "/assignments/"
        Then we get list with 0 items
