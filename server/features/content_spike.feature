Feature: Assignment Unlink
    Background: Initial Setup
        Given the "validators"
        """
        [
        {
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
        }
        ]
        """
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60}]
        """

    @auth
    @notification
    Scenario: On Spike of content removes the assignment_id of the content item
        When we post to "/archive" with success
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
        When we post to "/planning" with success
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "assignmentId" from coverage 0
        When we reset notifications
        When we get "assignments/#assignmentId#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get notifications
        """
        [{"event": "content:update"}]
        """
        When we get "assignments/#assignmentId#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "in_progress"
            }
        }
        """
        When we get "archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#assignmentId#"}
        """
        When we reset notifications
        When we spike "#archive._id#"
        Then we get spiked content "#archive._id#"
        When we get "assignments/#assignmentId#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we get "archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "__none__"}
        """