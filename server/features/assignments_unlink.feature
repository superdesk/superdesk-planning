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
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """

    @auth
    @notification
    @vocabularies
    Scenario: Removes the assignment_id of the content item
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
            }]
        """
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
        When we patch "/desks/#desks._id#"
        """
        {"members": [{"user": "#CONTEXT_USER_ID#"}]}
        """
        When we post to "/planning" with success
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
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
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get notifications
        """
        [{"event": "content:update"}, {"event": "content:link"}]
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
        And we store "firstuser" with value "#CONTEXT_USER_ID#" to context
        When we get "archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#assignmentId#"}
        """
        When we reset notifications
        When we switch user
        When we post to "assignments/unlink" with success
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get notifications
        """
        [{"event": "content:update"}, {"event": "content:unlink"}]
        """
        Then we get OK response
        When we get "/activity"
        Then we get existing resource
        """
        {"_items": [{
            "user_name" : "test-user-2",
            "data" : {
                "no_email" : true,
                "slugline" : "test slugline",
                "action" : "unlinked",
                "coverage_type" : "Text",
                "actioning_user" : "test-user-2",
                "is_link" : true,
                "omit_user" : true
            },
            "user" : "#CONTEXT_USER_ID#",
            "message" : "{{actioning_user}} has {{action}} a {{coverage_type}} coverage for \"{{slugline}}\"",
            "recipients" : [
                {
                    "user_id" : "#firstuser#",
                    "read" : false
                }
            ],
            "resource" : "assignments",
            "name" : "update"
        }]}
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
                "user": "#firstuser#",
                "state": "assigned"
            }
        }
        """
        When we get "archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "__none__"}
        """
        When we get "assignments_history"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "assignment_id": "#assignmentId#",
                "operation": "create"
            },
            {
                "assignment_id": "#assignmentId#",
                "operation": "content_link"
            },
            {
                "assignment_id": "#assignmentId#",
                "operation": "unlink"
            }
        ]}
        """

    @auth
    Scenario: Assignment must exist
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "5eb604dee984f205b6509a6f",
            "item_id": "noidea"
        }]
        """
        Then we get error 400
        """
        {"_message": "Assignment not found."}
        """

    @auth
    Scenario: Can unlink any type of assignment
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
        {
            "coverages": [{
                "planning": {
                    "ednote": "photo coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type": "photo"
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
        When we upload a file "bike.jpg" to "archive"
        And we patch "/archive/#archive._id#"
        """
        {
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response

    @auth
    @vocabularies
    Scenario: Content item must exist
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
            }]
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
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
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
    @vocabularies
    Scenario: Content must be linked to an Assignment
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
            }]
        """
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
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
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
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
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
    @vocabularies
    Scenario: Assignment and Content must be linked
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
            }]
        """
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
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
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
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
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
    @vocabularies
    Scenario: Content delivery record must exist
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
            }]
        """
        When we post to "/planning" with success
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
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

    @auth
    @vocabularies
    Scenario: Cannot unlink if the Assignment is locked by another user
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
            }]
        """
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
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
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
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we post to "/assignments/#assignmentId#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we switch user
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 403
        """
        {"_message": "Assignment is locked by another user. Cannot unlink assignment and content."}
        """

    @auth
    @vocabularies
    Scenario: Cannot unlink if the Content is locked by another user
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
            }]
        """
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
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
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
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we switch user
        When we patch "/desks/#desks._id#"
        """
        {"members":[{"user":"#USERS_ID#"},{"user":"#CONTEXT_USER_ID#"}]}
        """
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 403
        """
        {"_message": "Item is locked by another user. Cannot unlink assignment and content."}
        """

    @auth
    @vocabularies
    Scenario: Cannot unlink if the Content is locked by the same user in another session
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
            }]
        """
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
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
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
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we setup test user
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#assignmentId#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 403
        """
        {"_message": "Item is locked by you in another session. Cannot unlink assignment and content."}
        """
