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
    Scenario: Removes the assignment_id of the content item
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
        When we post to "assignments/unlink" with success
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

    @auth
    Scenario: Assignment must exist
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "noidea",
            "item_id": "noidea"
        }]
        """
        Then we get error 400
        """
        {"_message": "Assignment not found."}
        """

    @auth
    Scenario: Assignment must not be completed
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
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desk._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "in_progress"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "assignmentId" from coverage 0
        When we patch "assignments/#assignmentId#"
        """
        {
            "assigned_to": {
                "desk": "#desk._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed"
            }
        }
        """
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "noidea"
        }]
        """
        Then we get error 400
        """
        {"_message": "Assignment already completed."}
        """

    @auth
    Scenario: Content item must exist
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
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desk._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "in_progress"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "assignmentId" from coverage 0
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "noidea"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content item not found."}
        """

    @auth
    Scenario: Content must be linked to an Assignment
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
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desk._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "in_progress"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "assignmentId" from coverage 0
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content not linked to an assignment. Cannot unlink assignment and content."}
        """

    @auth
    Scenario: Assignment and Content must be linked
        When we post to "/archive" with success
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            },
            "assignment_id": "noidea"
        }]
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
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desk._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "in_progress"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "assignmentId" from coverage 0
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 400
        """
        {"_message": "Assignment and Content are not linked."}
        """

    @auth
    Scenario: Content delivery record must exist
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
        When we post to "/archive" with success
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            },
            "assignment_id": "#assignmentId#"
        }]
        """
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content doesnt exist for the assignment. Cannot unlink assignment and content.", "_status": "ERR"}
        """
