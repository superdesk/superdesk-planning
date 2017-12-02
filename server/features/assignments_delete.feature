Feature: Assignments Delete
    Background: Initial setup
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
            "slugline": "test slugline"
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
            }
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
                }
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
        [{"assignment_id": "#assignmentId#", "item_id": "#archive._id#"}]
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
