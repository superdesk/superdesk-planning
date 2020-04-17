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
    Scenario: Cannot delete an Assignment if assignment is not locked
        When we delete "/assignments/#assignmentId#"
        Then we get error 403
        When we post to "/assignments/#assignmentId#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we delete "/assignments/#assignmentId#"
        Then we get OK response
        When we get "/assignments/#assignmentId#"
        Then we get error 404

    @auth
    @notification
    Scenario: Can delete an Assignment if planning item is locked by the same user and session
        When we delete "/assignments/#assignmentId#"
        Then we get error 403
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
        When we reset notifications
        When we delete "/assignments/#assignmentId#"
        Then we get OK response
        When we get "/assignments/#assignmentId#"
        Then we get error 404
        When we get "/planning/#planning._id#"
        Then we get existing resource
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
                "assignments": ["#assignmentId#"],
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

    @auth @today
    Scenario: Deleting an Assignment in schedule_updates chain will remove all assignments in the chain
        Given "desks"
        """
        [{"_id": "desk_123", "name": "Politic Desk"}]
        """
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
        When we get "assignments/#firstscheduledassignment#"
        Then we get existing resource
        """
        { "_id": "#firstscheduledassignment#" }
        """
        When we get "assignments/#secondscheduledassignment#"
        Then we get existing resource
        """
        { "_id": "#secondscheduledassignment#" }
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
                    "workflow_status": "active",
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
                        "scheduled_update_id": "#firstscheduled#",
                        "assigned_to": {
                            "assignment_id": "#firstscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "assigned"
                        },
                        "coverage_id": "#firstcoverage#",
                        "workflow_status": "active",
                        "news_coverage_status": {
                          "qcode": "ncostat:int"
                        },
                        "planning": {
                            "internal_note": "Int. note",
                            "scheduled": "2029-11-27T14:00:00+0000"
                        }
                    },
                    {
                        "scheduled_update_id": "#secondscheduled#",
                        "assigned_to": {
                            "assignment_id": "#secondscheduledassignment#",
                            "desk": "desk_123",
                            "user": "507f191e810c19729de870eb",
                            "state": "assigned"
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
        When we get "assignments/#firstscheduledassignment#"
        Then we get existing resource
        """
        { "_id": "#firstscheduledassignment#" }
        """
        When we get "assignments/#secondscheduledassignment#"
        Then we get existing resource
        """
        { "_id": "#secondscheduledassignment#" }
        """
        When we post to "/assignments/#firstassignment#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we delete "/assignments/#firstassignment#"
        Then we get OK response
        When we get "assignments/#firstscheduledassignment#"
        Then we get error 404
        When we get "assignments/#secondscheduledassignment#"
        Then we get error 404

    @auth
    @link_updates
    @notification @today
    Scenario: Deleting an Assignment in schedule_updates chain will unlink all assignments content
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
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#REWRITE_ID#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        { "assignment_id": "#firstassignment#" }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        { "assignment_id": "#firstassignment#" }
        """
        When we post to "/assignments/#firstscheduledassignment#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we delete "/assignments/#firstscheduledassignment#"
        Then we get OK response
        And we get notifications
          """
          [{
              "event": "assignments:removed",
              "extra": {
                  "item": "#archive._id#"
              }
          },
          {
              "event": "assignments:removed",
              "extra": {
                  "item": "#REWRITE_ID#"
              }
          }]
          """
        When we get "assignments/#firstscheduledassignment#"
        Then we get error 404
        When we get "assignments/#firstassignment#"
        Then we get error 404
        When we get "assignments/#secondscheduledassignment#"
        Then we get error 404
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        { "assignment_id": null }
        """
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        { "assignment_id": null }
        """

    @auth
    Scenario: Deleting an Assignment removes assignment info from coverage autosaves
        Given "planning_autosave"
        """
        [{
            "_id": "#planning._id#",
            "coverages": [{
                "coverage_id": "#coverageId#",
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
            }],
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000"
        }]
        """
        When we post to "/assignments/#assignmentId#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we delete "/assignments/#assignmentId#"
        Then we get OK response
        When we get "/planning_autosave/#planning._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#coverageId#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
            },
            "assigned_to": "__no_value__",
            "workflow_status": "draft"
        }]}
        """
