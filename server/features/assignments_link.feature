Feature: Assignment link
    Background: Initial setup
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

    @auth @notification
    Scenario: Sets the assignment_id of the content item

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
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
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
        Then we store assignment id in "firstassignment" from coverage 0
        When we reset notifications
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        Then we get notifications
        """
        [{"event": "content:update"}]
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "assignments/#firstassignment#"
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
                "state": "in_progress"
            }
        }
        """
        When we get "/assignments_history"
        Then we get list with 2 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "content_link"
            }
        ]}
        """

    @auth
    Scenario: Assignment must exist
        When we post to "assignments/link"
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
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "noidea"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content item not found."}
        """

    @auth
    Scenario: Content item must not have an existing delivery record
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
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                },
                "workflow_status": "active"
            }]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content is already linked to an assignment. Cannot link assignment and content."}
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#"
                    },
                    "workflow_status": "active"
                },
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#"
                    },
                    "workflow_status": "active"
                }
            ]
        }
        """
        Then we get OK response
        Then we store assignment id in "secondassignment" from coverage 1
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#secondassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content is already linked to an assignment. Cannot link assignment and content."}
        """

    @auth @notification
    Scenario: If the item is published then on fulfil assignment state will be completed
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
        Then we get OK response
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
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we patch "/archive/#archive._id#"
        """
        {"slugline": "test"}
        """
        Then we get OK response
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we reset notifications
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed"
            }
        }
        """
        And we get notifications
        """
        [{
            "event": "assignments:completed",
            "extra": {
                "item": "#firstassignment#",
                "assigned_desk": "#desks._id#",
                "planning": "#planning._id#",
                "assignment_state": "completed"
            }
        }]
        """
        When we get "archive/#archive._id#"
        Then we get OK response
        And we get existing resource
        """
        { "assignment_id": "#firstassignment#"}
        """
        When we get "/published"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "assignment_id": "#firstassignment#",
                    "_id": "#archive._id#",
                    "state": "published"
                }
            ]
        }
        """


    @auth
    Scenario: If the item is corrected then on fulfil assignment state will be completed
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
        Then we get OK response
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
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we patch "/archive/#archive._id#"
        """
        {"slugline": "test"}
        """
        Then we get OK response
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we publish "#archive._id#" with "correct" type and "corrected" state
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed"
            }
        }
        """
        When we get "archive/#archive._id#"
        Then we get existing resource
        """
        { "assignment_id": "#firstassignment#"}
        """
        When we get "/published"
        Then we get existing resource
        """
        {
            "_items": [
                {
                    "assignment_id": "#firstassignment#",
                    "_id": "#archive._id#",
                    "state": "published"
                },
                {
                    "assignment_id": "#firstassignment#",
                    "_id": "#archive._id#",
                    "state": "corrected"
                }
            ]
        }
        """

    @auth @notification
    Scenario: If the item is scheduled then on fulfil assignment state will be inprogress
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
        Then we get OK response
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
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we patch "/archive/#archive._id#"
        """
        {"slugline": "test", "publish_schedule":"#DATE+2#"}
        """
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "in_progress"
            }
        }
        """
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we get "archive/#archive._id#"
        Then we get existing resource
        """
        {
            "state": "scheduled",
            "operation": "publish",
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "published"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "state": "scheduled",
                    "operation": "publish",
                    "_id": "#archive._id#",
                    "assignment_id": "#firstassignment#"
                }
            ]
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "in_progress"
            }
        }
        """
        When the publish schedule lapses
        """
        ["#archive._id#"]
        """
        When we enqueue published
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed"
            }
        }
        """
        When we get "archive/#archive._id#"
        Then we get existing resource
        """
        {
            "state": "published",
            "operation": "publish",
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "published"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "state": "published",
                    "operation": "publish",
                    "_id": "#archive._id#",
                    "assignment_id": "#firstassignment#"
                }
            ]
        }
        """

    @auth
    Scenario: Item on personal cannot be linked
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
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
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content not in workflow. Cannot link assignment and content.", "_status": "ERR"}
        """
