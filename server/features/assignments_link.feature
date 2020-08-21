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
        [{
            "name": "Sports",
            "content_expiry": 60,
            "members": [ {"user": "#CONTEXT_USER_ID#"} ]
        }]
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
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        Then we get notifications
        """
        [{"event": "content:update"}, {"event": "content:link"}]
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
            "assignment_id": "5eb604dee984f205b6509a6f",
            "item_id": "noidea",
            "reassign": true
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
            "item_id": "noidea",
            "reassign": true
        }]
        """
        Then we get error 400
        """
        {"_message": "Content item not found."}
        """

    @auth
    Scenario: Content item must not have an existing delivery record
        Given "vocabularies"
        """
        [{
            "_id": "newscoveragestatus",
            "display_name": "News Coverage Status",
            "type": "manageable",
            "unique_field": "qcode",
            "items": [
                {"is_active": true, "qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                {"is_active": true, "qcode": "ncostat:notdec", "name": "coverage not decided yet",
                    "label": "On merit"},
                {"is_active": true, "qcode": "ncostat:notint", "name": "coverage not intended",
                    "label": "Not planned"},
                {"is_active": true, "qcode": "ncostat:onreq", "name": "coverage upon request",
                    "label": "On request"}
            ]
        }]
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
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                },
                "workflow_status": "active",
                "news_coverage_status": {
                    "qcode": "ncostat:int"
                }
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
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
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
                    "workflow_status": "active",
                    "news_coverage_status": {
                        "qcode": "ncostat:int"
                    }
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
                    "workflow_status": "active",
                    "news_coverage_status": {
                        "qcode": "ncostat:int"
                    }
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
            "item_id": "#archive._id#",
            "reassign": true
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
            "item_id": "#archive._id#",
            "reassign": true
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
            "item_id": "#archive._id#",
            "reassign": true
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
        {
            "slugline": "test", "publish_schedule":"#DATE+2#"
        }
        """
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
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
        """
        {
            "publish_schedule":"#DATE+2#"
        }
        """
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
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get error 400
        """
        {"_message": "Content not in workflow. Cannot link assignment and content.", "_status": "ERR"}
        """

    @auth @notification
    Scenario: Link with reassign false does not change the assigned user

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
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "54fe3b8c10245412eac572bd"
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
            "item_id": "#archive._id#",
            "reassign": false
        }]
        """
        Then we get OK response
        Then we get notifications
        """
        [{"event": "content:update"}, {"event": "content:link"}]
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
                "user": "54fe3b8c10245412eac572bd",
                "state": "in_progress"
            }
        }
        """

    @auth @notification
    Scenario: Fulfil assignment with assignment and item on different desk
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
        Then we store "SportsDeskId" with value "#desks._id#" to context
        Then we store "SportsStageId" with value "#desks.incoming_stage#" to context
        When we post to "desks"
        """
        [{"name": "Politics", "content_expiry": 60}]
        """
        Then we get OK response
        Then we store "PoliticsDeskId" with value "#desks._id#" to context
        Then we store "PoliticsStageId" with value "#desks.incoming_stage#" to context
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
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#PoliticsDeskId#",
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
                "desk": "#PoliticsDeskId#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we patch "/archive/#archive._id#"
        """
        {"slugline": "test"}
        """
        Then we get existing resource
        """
        {
            "slugline": "test",
            "task": {
                "desk": "#SportsDeskId#",
                "stage": "#SportsStageId#"
            }
        }
        """
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we reset notifications
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
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
                "desk": "#SportsDeskId#",
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
                "assigned_desk": "#PoliticsDeskId#",
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
    @link_updates
    Scenario: Completed assignment remains completed when linked story is updated
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
        And "vocabularies"
        """
        [{
            "_id": "newscoveragestatus",
            "display_name": "News Coverage Status",
            "type": "manageable",
            "unique_field": "qcode",
            "items": [
                {"is_active": true, "qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                {"is_active": true, "qcode": "ncostat:notdec", "name": "coverage not decided yet",
                    "label": "On merit"},
                {"is_active": true, "qcode": "ncostat:notint", "name": "coverage not intended",
                    "label": "Not planned"},
                {"is_active": true, "qcode": "ncostat:onreq", "name": "coverage upon request",
                    "label": "On request"}
            ]
        }, {
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
        [{"guid": "123", "type": "text", "headline": "test", "state": "fetched",
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
        When we post to "/products" with success
        """
        {
        "name":"prod-1","codes":"abc,xyz", "product_type": "both"
        }
        """
        And we post to "/subscribers" with "wire" and success
        """
        {
        "name":"Channel 2","media_type":"media", "subscriber_type": "wire", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
        "products": ["#products._id#"],
        "destinations":[{"name":"Test","format": "nitf", "delivery_type":"email","config":{"recipients":"test@test.com"}}]
        }
        """
        And we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [
            {"_id": "123", "guid": "123", "headline": "test", "_current_version": 2, "state": "published",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"}
        }]}
        """
        When we enqueue published
        When we get "/publish_queue"
        Then we get list with 1 items
        """
        {
        "_items": [
          {"state": "pending", "content_type": "text",
          "subscriber_id": "#wire#", "item_id": "123", "item_version": 2,
          "ingest_provider": "__none__",
          "destination": {
            "delivery_type": "email"
          }}
        ]}
        """
        When we post to "/subscribers" with success
        """
        {
            "name":"News1","media_type":"media", "subscriber_type": "digital",
            "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
            "products": ["#products._id#"],
            "codes": "xyz, abc",
            "destinations": [
                {"name":"events", "format": "json_event", "delivery_type": "File", "config":{"file_path": "/tmp"}},
                {"name":"planning", "format": "json_planning", "delivery_type": "File", "config":{"file_path": "/tmp"}}
            ]
        }
        """
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "guid": "123",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "published_planning?sort=item_id,version"
        Then we get list with 1 items
        Then we store "PLANNING" with first item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning._id#",
                    "type": "planning",
                    "published_item": {
                        "_id": "#planning._id#",
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
                    }
                }
            ]
        }
        """
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-1.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "_id": "#archive._id#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "event_id": "#archive.event_id#",
            "type": "text",
            "state": "in_progress",
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "123", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#"}]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        Then we store "PLANNING" with 3 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-3.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#"},
                    {"item_state": "in_progress", "item_id": "#REWRITE_ID#"}
                ]
            }]
        }
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get list with 2 items
        """
        {
        "_items": [
            { "_id": "123", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#" },
            {"_id": "#REWRITE_ID#", "rewrite_of": "123", "assignment_id": "#firstassignment#"}
        ]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#"},
                    {"item_state": "published", "item_id": "#REWRITE_ID#"}
                ]
            }]
        }
        """

    @auth
    @notification
    Scenario: Can link only rewrites to scheduled update assignments
    Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
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
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        { "_id": "#firstassignment#" }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "assigned_to": {
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we store scheduled_update id in "firstscheduled" from scheduled_update 0 of coverage 0
        Then we store scheduled_update id in "secondscheduled" from scheduled_update 1 of coverage 0
        Then we store assignment id in "firstscheduledassignment" from scheduled_update 0 of coverage 0
        Then we store assignment id in "secondscheduledassignment" from scheduled_update 1 of coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00+0000"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00+0000"
                        }
                    },
                    {
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "scheduled_update_id": "#firstscheduled#",
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "scheduled_update_id": "#secondscheduled#",
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we get OK response
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
        [{
            "assignment_id": "#firstscheduledassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get error 400
        """
        {"_message": "Only updates can be linked to a scheduled update assignment"}
        """

    @auth
    @notification
    @link_updates
    Scenario: Can't link scheduled update if coverage is not linked
    Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
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
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        { "_id": "#firstassignment#" }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "assigned_to": {
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we store scheduled_update id in "firstscheduled" from scheduled_update 0 of coverage 0
        Then we store scheduled_update id in "secondscheduled" from scheduled_update 1 of coverage 0
        Then we store assignment id in "firstscheduledassignment" from scheduled_update 0 of coverage 0
        Then we store assignment id in "secondscheduledassignment" from scheduled_update 1 of coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00+0000"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00+0000"
                        }
                    },
                    {
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "scheduled_update_id": "#firstscheduled#",
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "scheduled_update_id": "#secondscheduled#",
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we get OK response
        When we post to "/archive" with success
        """
        [{"type": "text", "headline": "test", "state": "fetched",
        "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
        "subject":[{"qcode": "17004000", "name": "Statistics"}],
        "slugline": "test",
        "body_html": "Test Document body",
        "target_subscribers": [{"_id": "#subscribers._id#"}],
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
        And we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        And we store "rewrite1" with value "#REWRITE_ID#" to context
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we rewrite "#rewrite1#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstscheduledassignment#",
            "item_id": "#rewrite1#",
            "reassign": true
        }]
        """
        Then we get error 400
        """
        {"_message": "Previous coverage is not linked to content."}
        """

    @auth
    @notification
    @link_updates
    Scenario: Can't link scheduled update if previous scheduled update is not linked
    Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
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
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        { "_id": "#firstassignment#" }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "assigned_to": {
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we store scheduled_update id in "firstscheduled" from scheduled_update 0 of coverage 0
        Then we store scheduled_update id in "secondscheduled" from scheduled_update 1 of coverage 0
        Then we store assignment id in "firstscheduledassignment" from scheduled_update 0 of coverage 0
        Then we store assignment id in "secondscheduledassignment" from scheduled_update 1 of coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00+0000"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00+0000"
                        }
                    },
                    {
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "scheduled_update_id": "#firstscheduled#",
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "scheduled_update_id": "#secondscheduled#",
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we get OK response
        When we post to "/archive" with success
        """
        [{"type": "text", "headline": "test", "state": "fetched",
        "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
        "subject":[{"qcode": "17004000", "name": "Statistics"}],
        "slugline": "test",
        "body_html": "Test Document body",
        "target_subscribers": [{"_id": "#subscribers._id#"}],
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
        And we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        And we store "rewrite1" with value "#REWRITE_ID#" to context
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#rewrite1#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we rewrite "#rewrite1#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#rewrite1#"
        Then we get existing resource
        """
        { "assignment_id": "#firstassignment#" }
        """
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#secondscheduledassignment#",
            "item_id": "#REWRITE_ID#",
            "reassign": true,
            "force": true
        }]
        """
        Then we get error 400
        """
        {"_message": "Previous scheduled-update pending content-linking/completion"}
        """

    @auth
    @notification
    @link_updates
    Scenario: Content will link by default to latest in_progress/completed assignment
    Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
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
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        { "_id": "#firstassignment#" }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "desk": "#desks._id#",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "assigned_to": {
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we store scheduled_update id in "firstscheduled" from scheduled_update 0 of coverage 0
        Then we store scheduled_update id in "secondscheduled" from scheduled_update 1 of coverage 0
        Then we store assignment id in "firstscheduledassignment" from scheduled_update 0 of coverage 0
        Then we store assignment id in "secondscheduledassignment" from scheduled_update 1 of coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00+0000"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "#desks._id#",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00+0000"
                        }
                    },
                    {
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "scheduled_update_id": "#firstscheduled#",
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "#desks._id#",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "scheduled_update_id": "#secondscheduled#",
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we get OK response
        When we post to "/archive" with success
        """
        [{"type": "text", "headline": "test", "state": "fetched",
        "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
        "subject":[{"qcode": "17004000", "name": "Statistics"}],
        "slugline": "test",
        "body_html": "Test Document body",
        "target_subscribers": [{"_id": "#subscribers._id#"}],
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
        And we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        And we store "rewrite1" with value "#REWRITE_ID#" to context
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#rewrite1#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we patch "/assignments/#firstscheduledassignment#"
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed"
            }
        }
        """
        Then we get OK response
        When we rewrite "#rewrite1#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        { "assignment_id": "#firstscheduledassignment#" }
        """

    @auth
    @notification
    @link_updates
    Scenario: Using 'force' option will reassign to a new assignment
    Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
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
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        { "_id": "#firstassignment#" }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "desk": "#desks._id#",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "assigned_to": {
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we store scheduled_update id in "firstscheduled" from scheduled_update 0 of coverage 0
        Then we store scheduled_update id in "secondscheduled" from scheduled_update 1 of coverage 0
        Then we store assignment id in "firstscheduledassignment" from scheduled_update 0 of coverage 0
        Then we store assignment id in "secondscheduledassignment" from scheduled_update 1 of coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00+0000"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "#desks._id#",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00+0000"
                        }
                    },
                    {
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "scheduled_update_id": "#firstscheduled#",
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "#desks._id#",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "scheduled_update_id": "#secondscheduled#",
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we get OK response
        When we post to "/archive" with success
        """
        [{"type": "text", "headline": "test", "state": "fetched",
        "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
        "subject":[{"qcode": "17004000", "name": "Statistics"}],
        "slugline": "test",
        "body_html": "Test Document body",
        "target_subscribers": [{"_id": "#subscribers._id#"}],
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
        And we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        And we store "rewrite1" with value "#REWRITE_ID#" to context
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#rewrite1#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we patch "/assignments/#firstscheduledassignment#"
        """
        {
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed"
            }
        }
        """
        Then we get OK response
        When we rewrite "#rewrite1#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        { "assignment_id": "#firstscheduledassignment#" }
        """
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#secondscheduledassignment#",
            "item_id": "#REWRITE_ID#",
            "reassign": true,
            "force": true
        }]
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        { "assignment_id": "#secondscheduledassignment#" }
        """

    @auth
    @notification
    @link_updates
    Scenario: Using 'force' option will still validate assignment being linked
    Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
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
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
                    }
                }
            ]
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        { "_id": "#firstassignment#" }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "desk": "#desks._id#",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "assigned_to": {
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we store scheduled_update id in "firstscheduled" from scheduled_update 0 of coverage 0
        Then we store scheduled_update id in "secondscheduled" from scheduled_update 1 of coverage 0
        Then we store assignment id in "firstscheduledassignment" from scheduled_update 0 of coverage 0
        Then we store assignment id in "secondscheduledassignment" from scheduled_update 1 of coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00+0000"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "#desks._id#",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00+0000"
                        }
                    },
                    {
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "draft"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "draft",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00.000Z"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#",
                        "desk": "desk_123",
                        "user": "507f191e810c19729de870eb"
                    },
                    "scheduled_updates": [{
                        "scheduled_update_id": "#firstscheduled#",
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "#desks._id#",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00.000Z"
                        }
                    },
                    {
                        "scheduled_update_id": "#secondscheduled#",
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "active"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-28T14:00:00+0000"
                        }
                    }]
                }
            ]
        }
        """
        Then we get OK response
        When we post to "/archive" with success
        """
        [{"type": "text", "headline": "test", "state": "fetched",
        "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
        "subject":[{"qcode": "17004000", "name": "Statistics"}],
        "slugline": "test",
        "body_html": "Test Document body",
        "target_subscribers": [{"_id": "#subscribers._id#"}],
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
        And we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        And we store "rewrite1" with value "#REWRITE_ID#" to context
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#rewrite1#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we rewrite "#rewrite1#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        { "assignment_id": "#firstassignment#" }
        """
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#secondscheduledassignment#",
            "item_id": "#REWRITE_ID#",
            "reassign": true,
            "force": true
        }]
        """
        Then we get error 400
        """
        {"_message": "Previous scheduled-update pending content-linking/completion"}
        """

    @auth
    Scenario: PLANNING_ALLOWED_COVERAGE_LINK_TYPES controls content links
        Given config update
        """
        {"PLANNING_ALLOWED_COVERAGE_LINK_TYPES": ["text"]}
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
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
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
                    "ednote": "text coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }, {
                "planning": {
                    "ednote": "photo coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type": "photo"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "textassignment" from coverage 0
        Then we store assignment id in "pictureassignment" from coverage 1
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#textassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
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
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#pictureassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get error 400
        """
        {"_message": "Content type \"picture\" is not allowed to be linked to a coverage"}
        """
        Given config update
        """
        {"PLANNING_ALLOWED_COVERAGE_LINK_TYPES": ["text", "picture"]}
        """
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#pictureassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
