Feature: Assignments
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
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """

    @auth
    Scenario: Empty planning list
        Given empty "assignments"
        When we get "/assignments"
        Then we get list with 0 items


    @auth
    @notification
    Scenario: Assignments are created in draft when coverage is in draft status
        Given empty "assignments"
        Given empty "assignments_history"
        When we post to "assignments"
        """
        [
          {
            "assigned_to": {
              "user": "1234",
              "desk": "1234"
            }
          }
        ]
        """
        Then we get error 405
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "coverage_provider": {
                            "qcode": "stringer",
                            "name": "Stringer"}
                    },
                    "workflow_status": "draft"
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/planning/#planning._id#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "assignment_id": "#firstassignment#",
                        "coverage_provider": {"name": "Stringer"},
                        "state": "draft"
                    }
                }
            ]
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "type": "assignment",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "coverage_provider": {"name": "Stringer"},
                "state": "draft"
            }
        }
        """
        When we get "/assignments_history"
        Then we get list with 1 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            }
        ]}
        """
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {"item": "#planning._id#"}
        }]
        """

    @auth
    @notification
    Scenario: Assignments move from draft to assigned when coverage is made active
        Given empty "assignments"
        Given empty "assignments_history"
        When we post to "assignments"
        """
        [
          {
            "assigned_to": {
              "user": "1234",
              "desk": "1234"
            }
          }
        ]
        """
        Then we get error 405
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "coverage_provider": {
                            "qcode": "stringer",
                            "name": "Stringer"}
                    },
                    "workflow_status": "draft"
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/planning/#planning._id#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "assignment_id": "#firstassignment#",
                        "coverage_provider": {"name": "Stringer"},
                        "state": "draft"
                    }
                }
            ]
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "type": "assignment",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "coverage_provider": {"name": "Stringer"},
                "state": "draft"
            }
        }
        """
        When we get "/assignments_history"
        Then we get list with 1 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            }
        ]}
        """
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {"item": "#planning._id#"}
        }]
        """
        When we reset notifications
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "assignment_id": "#firstassignment#",
                        "coverage_provider": {"name": "Stringer"},
                        "state": "draft"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/planning/#planning._id#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "assignment_id": "#firstassignment#",
                        "coverage_provider": {"name": "Stringer"},
                        "state": "assigned"
                    }
                }
            ]
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "coverage_provider": {"name": "Stringer"},
                "state": "assigned"
            }
        }
        """
        When we get "/assignments_history"
        Then we get list with 1 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            }
        ]}
        """
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {"item": "#planning._id#"}
        }]
        """
        When we reset notifications
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "coverage_provider": {"qcode":"agencies", "name": "Agencies"}
            }
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "assignments:updated",
            "extra": {
                "item": "#firstassignment#",
                "coverage": "#firstcoverage#",
                "planning": "#planning._id#",
                "assignment_state": "assigned",
                "assigned_user": "#CONTEXT_USER_ID#",
                "assigned_desk": "#desks._id#",
                "lock_user": null,
                "user": "#CONTEXT_USER_ID#",
                "original_assigned_desk": "#desks._id#",
                "original_assigned_user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        Given empty "activity"
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "507f191e810c19729de87034",
                "coverage_provider": {"qcode": "agencies", "name": "Agencies"}
            }
        }
        """
        Then we get OK response
        When we get "/activity"
        Then we get existing resource
        """
        {"_items": [
            {
                "message": "{{coverage_type}} coverage \"{{slugline}}\" has been reassigned to you on desk ({{desk}})"
            }
        ]}
        """

    @auth
    @notification
    Scenario: Assignments are created via coverages
        Given empty "assignments"
        Given empty "assignments_history"
        When we post to "assignments"
        """
        [
          {
            "assigned_to": {
              "user": "1234",
              "desk": "1234"
            }
          }
        ]
        """
        Then we get error 405
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "coverage_provider": {
                            "qcode": "stringer",
                            "name": "Stringer"}
                    },
                    "workflow_status": "active"
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/planning/#planning._id#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "assignment_id": "#firstassignment#",
                        "coverage_provider": {"name": "Stringer"},
                        "state": "assigned"
                    }
                }
            ]
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "coverage_provider": {"name": "Stringer"},
                "state": "assigned"
            }
        }
        """
        When we get "/assignments_history"
        Then we get list with 1 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            }
        ]}
        """
        And we get notifications
        """
        [{
            "event": "assignments:created",
            "extra": {
                "item": "#firstassignment#",
                "coverage": "#firstcoverage#",
                "planning": "#planning._id#",
                "assignment_state": "assigned",
                "assigned_user": "#CONTEXT_USER_ID#",
                "assigned_desk": "#desks._id#",
                "lock_user": null,
                "user": "#CONTEXT_USER_ID#",
                "original_assigned_desk": null,
                "original_assigned_user": null
            }
        },
        {
            "event": "planning:updated",
            "extra": {"item": "#planning._id#"}
        }]
        """
        When we reset notifications
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "coverage_provider": {"qcode":"agencies", "name": "Agencies"}
            }
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "assignments:updated",
            "extra": {
                "item": "#firstassignment#",
                "coverage": "#firstcoverage#",
                "planning": "#planning._id#",
                "assignment_state": "assigned",
                "assigned_user": "#CONTEXT_USER_ID#",
                "assigned_desk": "#desks._id#",
                "lock_user": null,
                "user": "#CONTEXT_USER_ID#",
                "original_assigned_desk": "#desks._id#",
                "original_assigned_user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        Given empty "activity"
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "507f191e810c19729de87034",
                "coverage_provider": {"qcode": "agencies", "name": "Agencies"}
            }
        }
        """
        Then we get OK response
        When we get "/activity"
        Then we get existing resource
        """
        {"_items": [
            {
                "message": "{{coverage_type}} coverage \"{{slugline}}\" has been reassigned to you on desk ({{desk}})"
            }
        ]}
        """

    @auth
    @vocabularies
    @notification
    Scenario: Assignee changes as the author of content changes
        Given empty "assignments_history"
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
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we reset notifications
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
                },
                "workflow_status": "active"
            }]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        And we get notifications
        """
        [{
            "event": "assignments:created",
            "extra": {
                "item": "#firstassignment#",
                "coverage": "#firstcoverage#",
                "planning": "#planning._id#",
                "assignment_state": "assigned",
                "assigned_user": "#CONTEXT_USER_ID#",
                "assigned_desk": "#desks._id#",
                "lock_user": null,
                "user": "#CONTEXT_USER_ID#",
                "original_assigned_desk": null,
                "original_assigned_user": null
            }
        }]
        """
        Then we store assignment id in "firstassignment" from coverage 0
        When we patch "/archive/#archive._id#"
        """
        {"headline": "test headline 2"}
        """
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
        And we get notifications
        """
        [{
            "event": "assignments:updated",
            "extra": {
                "item": "#firstassignment#",
                "coverage": "#firstcoverage#",
                "planning": "#planning._id#",
                "assignment_state": "in_progress",
                "assigned_user": "#CONTEXT_USER_ID#",
                "assigned_desk": "#desks._id#",
                "lock_user": null,
                "user": "#CONTEXT_USER_ID#",
                "original_assigned_desk": "#desks._id#",
                "original_assigned_user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
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
        When we switch user
        When we patch "/archive/#archive._id#"
        """
        { "slugline": "I'm changing the user" }
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#USERS_ID#",
                "state": "in_progress"
            }
        }
        """
        When we get "/assignments_history"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "update"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "update"
            }
        ]}
        """

    @auth
    @vocabularies
    Scenario: Desk re-assignment not allowed if assignment is in progress or submitted
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
                },
                "workflow_status": "active"
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
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
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "Sports Desk",
                "user": "507f191e810c19729de870eb"
            }
        }
        """
        Then we get error 400
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "state": "submitted"
            }
        }
        """
        Then we get OK response
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "Sports Desk",
                "user": "507f191e810c19729de870eb"
            }
        }
        """
        Then we get error 400


    @auth
    @vocabularies
    Scenario: User re-assignment of submitted assignment moves to in_progress
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
                },
                "workflow_status": "active"
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
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
        When we post to "/desks" with "FINANCE_DESK_ID" and success
        """
        [{"name": "Finance", "desk_type": "production" }]
        """
        And we switch user
        And we post to "/archive/#archive._id#/move"
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": null,
                "state": "submitted"
            }
        }
        """
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "507f191e810c19729de870eb"
            }
        }
        """
        Then we get OK response
        When we get "/assignments_history"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "content_link"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "submitted"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "update"
            }
        ]}
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "507f191e810c19729de870eb",
                "state": "in_progress"
            }
        }
        """

    @auth
    @vocabularies
    Scenario: Sending an archive item to another desk changes desk assignment of assignment
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
                },
                "workflow_status": "active"
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
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
        When we post to "/desks" with "FINANCE_DESK_ID" and success
        """
        [{"name": "Finance", "desk_type": "production" }]
        """
        And we switch user
        And we post to "/archive/#archive._id#/move"
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": null,
                "state": "submitted"
            }
        }
        """
        When we get "/assignments_history"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "content_link"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "submitted"
            }
        ]}
        """

    @auth
    @vocabularies
    Scenario: Publishing an archive item changes assignment status to complete
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
        When we post to "/archive" with success
        """
        [{"type": "text", "headline": "test", "state": "fetched",
        "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
        "subject":[{"qcode": "17004000", "name": "Statistics"}],
        "slugline": "test",
        "body_html": "Test Document body",
        "dateline": {
          "located" : {
              "country" : "Afghanistan",
              "tz" : "Asia/Kabul",
              "city" : "Mazar-e Sharif",
              "alt_name" : "",
              "country_code" : "AF",
              "city_code" : "Mazar-e Sharif",
              "dateline" : "city",
              "state" : "Balkh",
              "state_code" : "AF.30"
          },
          "text" : "MAZAR-E SHARIF, Dec 30  -",
          "source": "AAP"}
        }]
        """
        Then we get OK response
        And we get existing resource
        """
        {"_current_version": 1, "state": "fetched", "task":{"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"byline": "Admin Admin"}
        """
        Then we get OK response
        When we post to "/products" with success
        """
        {
        "name":"prod-1","codes":"abc,xyz", "product_type": "both"
        }
        """
        And we post to "/subscribers" with "digital" and success
        """
        {
        "name":"Channel 1","media_type":"media", "subscriber_type": "digital", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
        "products": ["#products._id#"],
        "destinations":[{"name":"Test","format": "nitf", "delivery_type":"email","config":{"recipients":"test@test.com"}}]
        }
        """
        And we post to "/subscribers" with "wire" and success
        """
        {
        "name":"Channel 2","media_type":"media", "subscriber_type": "wire", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
        "products": ["#products._id#"],
        "destinations":[{"name":"Test","format": "nitf", "delivery_type":"email","config":{"recipients":"test@test.com"}}],
        "api_products": ["#products._id#"]
        }
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
                    "user": "#CONTEXT_USER_ID#",
                    "state": "in_progress"
                },
                "workflow_status": "active"
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
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
        And we get existing resource
        """
        {
        "_current_version": 2,
        "type": "text",
        "state": "published",
        "task":{"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
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

    @auth
    @vocabularies
    @notification
    Scenario: Test notifications on assignment to desk and user then reassign to desk only
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "coverage_provider": {
                            "qcode": "stringer",
                            "name": "Stringer"}
                    },
                    "workflow_status": "active"
                }
            ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/activity"
        Then we get existing resource
        """
        {
           "_items":[
              {
                 "name":"update",
                 "recipients":[
                    {
                       "user_id":"#CONTEXT_USER_ID#",
                       "read":false
                    }
                 ],
                 "resource":"assignments",
                 "user":"#CONTEXT_USER_ID#",
                 "data":{
                    "assignee":"yourself",
                    "assignor":"You"
                 },
                 "user_name":"test_user",
                 "message":"{{assignor}} assigned a coverage to {{assignee}}"
              }
           ]
        }
        """
        Given empty "activity"
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "user": null
            }
        }
        """
        Then we get OK response
        When we get "/activity"
        Then we get existing resource
        """
        {
           "_items":[
              {
                 "data":{
                    "assign_type":"reassigned",
                    "desk":"Sports",
                    "slugline":"test slugline",
                    "coverage_type":"text"
                 },
                 "resource":"assignments",
                 "user":"#CONTEXT_USER_ID#",
                 "message":"{{coverage_type}} coverage \"{{slugline}}\" {{assign_type}} to desk {{desk}}",
                 "name":"update",
                 "recipients":[
                    {
                       "read":false,
                       "user_id":"#CONTEXT_USER_ID#"
                    }
                 ],
                 "user_name":"test_user"
              }
           ]
        }
        """

    @auth
    @vocabularies
    @notification
    Scenario: Test notifications on assignment to desk only reassigned to a desk and user
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        And we store "firstuser" with value "#CONTEXT_USER_ID#" to context
        When we patch "/planning/#planning._id#"
        """
        {
           "coverages":[
              {
                 "planning":{
                    "ednote":"test coverage, I want 250 words",
                    "headline":"test headline",
                    "slugline":"test slugline",
                    "g2_content_type":"text"
                 },
                 "assigned_to":{
                    "desk":"#desks._id#"
                 },
                 "workflow_status": "active"
              }
           ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/activity"
        Then we get existing resource
        """
        {"_items": [
           {
                    "data" : {
                        "desk" : "Sports",
                        "coverage_type" : "text",
                        "assign_type" : "assigned",
                        "slugline" : "test slugline"
                    },
                    "message" : "{{coverage_type}} coverage \"{{slugline}}\" {{assign_type}} to desk {{desk}}",
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
        Given empty "activity"
        When we switch user
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "user": "#CONTEXT_USER_ID#",
                "desk":"#desks._id#"
            }
        }
        """
        Then we get OK response
        When we get "/activity"
        Then we get existing resource
        """
        {
           "_items":[
              {
                 "name":"update",
                 "recipients":[
                    {
                       "user_id":"#firstuser#",
                       "read":false
                    }
                 ],
                 "message":"{{coverage_type}} coverage \"{{slugline}}\" has been reassigned to {{assignee}} on desk ({{desk}})",
                 "data":{
                    "slugline":"test slugline",
                    "assignee":"test-user-2",
                    "coverage_type":"text",
                    "desk":"Sports"
                 },
                 "resource":"assignments",
                 "user":"#CONTEXT_USER_ID#",
                 "user_name":"test-user-2"
              },
              {
                 "name":"update",
                 "recipients":[
                    {
                       "user_id":"#CONTEXT_USER_ID#",
                       "read":false
                    }
                 ],
                 "message":"{{coverage_type}} coverage \"{{slugline}}\" has been reassigned{{old_assignee}} to you on desk ({{desk}}) ",
                 "data":{
                    "slugline":"test slugline",
                    "old_assignee":"",
                    "coverage_type":"text",
                    "desk":"Sports"
                 },
                 "resource":"assignments",
                 "user":"#CONTEXT_USER_ID#",
                 "user_name":"test-user-2"
              }
           ]
        }
        """

    @auth
    @vocabularies
    @notification
    Scenario: Test notifications on assignment to desk and user reassigned to another desk and user
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        And we store "firstuser" with value "#CONTEXT_USER_ID#" to context
        When we patch "/planning/#planning._id#"
        """
        {
           "coverages":[
              {
                 "planning":{
                    "ednote":"test coverage, I want 250 words",
                    "headline":"test headline",
                    "slugline":"test slugline",
                    "g2_content_type":"text"
                 },
                 "assigned_to":{
                    "desk":"#desks._id#",
                    "user":"#firstuser#"
                 },
                 "workflow_status": "active"
              }
           ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        Then we get OK response
        And we store "seconduser" with value "#users._id#" to context
        When we patch "/desks/#desks._id#"
        """
        {"members": [{"user": "#firstuser#"}, {"user": "#seconduser#"}]}
        """
        Then we get OK response
        Given empty "activity"
        When we switch user
        Then we store "thirduser" with value "#users._id#" to context
        Given empty "activity"
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "user": "#seconduser#",
                "desk":"#desks._id#"
            }
        }
        """
        Then we get OK response
        When we get "/activity"
        Then we get existing resource
        """
        {"_items": [
        {
            "name":"update",
                    "recipients":[
                       {
                          "user_id":"#firstuser#",
                          "read":false
                       }
                    ],
            "message" : "{{coverage_type}} coverage \"{{slugline}}\" has been reassigned to {{assignee}} on desk ({{desk}})",
            "data" : {
                "coverage_type" : "text",
                "desk" : "Sports",
                "slugline" : "test slugline",
                "assignee" : "foo"
            }
        },
                {
            "name":"update",
                    "recipients":[
                       {
                          "user_id":"#seconduser#",
                          "read":false
                       }
                    ],
            "message" : "{{coverage_type}} coverage \"{{slugline}}\" has been reassigned{{old_assignee}} to you on desk ({{desk}}) ",
            "data" : {
                "old_assignee" : " from test_user",
                "coverage_type" : "text",
                "slugline" : "test slugline",
                "desk" : "Sports"
            }
        }
        ]}
        """

    @auth
    @vocabularies
    @notification
    Scenario: Testing notifications on assignment change between desks
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
           "coverages":[
              {
                 "planning":{
                    "ednote":"test coverage, I want 250 words",
                    "headline":"test headline",
                    "slugline":"test slugline",
                    "g2_content_type":"text"
                 },
                 "assigned_to":{
                    "desk":"#desks._id#"
                 },
                 "workflow_status": "active"
              }
           ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "/desks"
        """
        [{"name": "News", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        Given empty "activity"
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk":"#desks._id#"
            }
        }
        """
        Then we get OK response
        When we get "/activity"
        Then we get existing resource
        """
        {"_items": [
           {
                    "name":"update",
                    "recipients":[
                       {
                          "user_id":"#CONTEXT_USER_ID#",
                          "read":false
                       }
                    ],
                    "resource":"assignments",
                    "user":"#CONTEXT_USER_ID#",
                    "user_name":"test_user",
                    "message" : "{{coverage_type}} coverage \"{{slugline}}\" has been submitted to desk {{desk}} from {{from_desk}}",
                    "data" : {
                        "desk" : "News",
                        "coverage_type" : "text",
                        "slugline" : "test slugline",
                        "from_desk" : "Sports"
                    }
                 }
        ]}
        """

    @auth
    @vocabularies
    @notification
    Scenario: Test notifications on assignment change between desks and users
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        And we store "firstuser" with value "#CONTEXT_USER_ID#" to context
        When we patch "/planning/#planning._id#"
        """
        {
           "coverages":[
              {
                 "planning":{
                    "ednote":"test coverage, I want 250 words",
                    "headline":"test headline",
                    "slugline":"test slugline",
                    "g2_content_type":"text"
                 },
                 "assigned_to":{
                    "desk":"#desks._id#",
                    "user": "#firstuser#"
                 },
                 "workflow_status": "active"
              }
           ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        Then we get OK response
        And we store "seconduser" with value "#users._id#" to context
        When we post to "/desks"
        """
        [{"name": "News", "content_expiry": 60, "members": [{"user": "#firstuser#"}, {"user": "#seconduser#"}]}]
        """
        When we switch user
        Given empty "activity"
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk":"#desks._id#",
                "user":"#seconduser#"
            }
        }
        """
        Then we get OK response
        When we get "/activity"
        Then we get existing resource
        """
        { "_items": [
            {
               "user_name":"test-user-2",
               "recipients" : [
                {
                    "user_id" : "#firstuser#",
                    "read" : false
                }
                ],
               "data":{
                  "assignee":"foo",
                  "old_assignee":"test_user",
                  "slugline":"test slugline",
                  "coverage_type":"text",
                  "old_desk":"Sports",
                  "desk":"News"
               },
               "message":"{{coverage_type}} coverage \"{{slugline}}\" has been reassigned to {{assignee}} ({{desk}}) from {{old_assignee}} ({{old_desk}})"
            },
                        {
               "user_name":"test-user-2",
               "recipients" : [
                {
                    "user_id" : "#seconduser#",
                    "read" : false
                }
                ],
               "data":{
                  "assignee":"foo",
                  "old_assignee":"test_user",
                  "slugline":"test slugline",
                  "coverage_type":"text",
                  "old_desk":"Sports",
                  "desk":"News"
               },
               "message":"{{coverage_type}} coverage \"{{slugline}}\" has been reassigned to {{assignee}} ({{desk}}) from {{old_assignee}} ({{old_desk}})"
            }
        ]}
        """
