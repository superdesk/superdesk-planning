Feature: Planning Assignment Reassignment State Management

    Background: Initial setup
        Given "desks"
        """
        [{"name": "Sports Desk", "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """

    @auth
    @notification
    @vocabulary
    Scenario: User reassignment preserves IN_PROGRESS state by default (config OFF)
        Given empty "planning"
        When we post to "/archive"
        """
        [{
            "guid": "test_content_preserve",
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "guid": "test_preserve_state",
            "headline": "Test preserve state on reassignment",
            "slugline": "test preserve state",
            "planning_date": "2026-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store coverage id in "coverage1" from coverage 0
        Then we store assignment id in "assignment1" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#assignment1#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "in_progress",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "coverage_id": "#coverage1#",
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "507f191e810c19729de870eb",
                    "assignment_id": "#assignment1#"
                }
            }]
        }
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "in_progress",
                "desk": "#desks._id#",
                "user": "507f191e810c19729de870eb"
            }
        }
        """

    @auth
    @notification
    @vocabulary
    Scenario: User reassignment resets to ASSIGNED state when config enabled
        Given empty "planning"
        When we set config assignment reset state on reassignment to True
        When we post to "/archive"
        """
        [{
            "guid": "test_content_reset",
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "guid": "test_reset_state",
            "headline": "Test reset state on reassignment",
            "slugline": "test reset state",
            "planning_date": "2026-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store coverage id in "coverage1" from coverage 0
        Then we store assignment id in "assignment1" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#assignment1#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "in_progress",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "coverage_id": "#coverage1#",
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "507f191e810c19729de870eb",
                    "assignment_id": "#assignment1#"
                }
            }]
        }
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "assigned",
                "desk": "#desks._id#",
                "user": "507f191e810c19729de870eb"
            }
        }
        """

    @auth
    @notification
    @vocabulary
    Scenario: Unassigning user preserves IN_PROGRESS state (config OFF)
        Given empty "planning"
        When we post to "/archive"
        """
        [{
            "guid": "test_content_unassign_preserve",
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "guid": "test_unassign_preserve",
            "headline": "Test unassignment preserves state",
            "slugline": "test unassign preserve",
            "planning_date": "2026-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store coverage id in "coverage1" from coverage 0
        Then we store assignment id in "assignment1" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#assignment1#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "in_progress",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "coverage_id": "#coverage1#",
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "assignment_id": "#assignment1#"
                }
            }]
        }
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "in_progress",
                "desk": "#desks._id#"
            }
        }
        """

    @auth
    @notification
    @vocabulary
    Scenario: Unassigning user resets to ASSIGNED when config enabled
        Given empty "planning"
        When we set config assignment reset state on reassignment to True
        When we post to "/archive"
        """
        [{
            "guid": "test_content_unassign_reset",
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "guid": "test_unassign_reset",
            "headline": "Test unassignment with config enabled",
            "slugline": "test unassign reset",
            "planning_date": "2026-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store coverage id in "coverage1" from coverage 0
        Then we store assignment id in "assignment1" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#assignment1#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "in_progress",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "coverage_id": "#coverage1#",
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": null,
                    "assignment_id": "#assignment1#"
                }
            }]
        }
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "assigned",
                "desk": "#desks._id#"
            }
        }
        """

    @auth
    @notification
    @vocabulary
    Scenario: Desk change without user change does NOT trigger state reset
        Given empty "planning"
        When we set config assignment reset state on reassignment to True
        When we post to "desks"
        """
        {"name": "Politics Desk", "members": [{"user": "#CONTEXT_USER_ID#"}]}
        """
        Then we get OK response
        When we post to "/archive"
        """
        [{
            "guid": "test_content_desk_change",
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "guid": "test_desk_change",
            "headline": "Test desk change",
            "slugline": "test desk change",
            "planning_date": "2026-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store coverage id in "coverage1" from coverage 0
        Then we store assignment id in "assignment1" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#assignment1#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "in_progress",
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "coverage_id": "#coverage1#",
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks[1]._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "assignment_id": "#assignment1#"
                }
            }]
        }
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "in_progress",
                "desk": "#desks[1]._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """

    @auth
    @notification
    @vocabulary
    Scenario: ASSIGNED state is also reset on user reassignment when config enabled
        Given empty "planning"
        When we set config assignment reset state on reassignment to True
        When we post to "/planning"
        """
        [{
            "guid": "test_assigned_reset",
            "headline": "Test ASSIGNED state reset",
            "slugline": "test assigned reset",
            "planning_date": "2026-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store coverage id in "coverage1" from coverage 0
        Then we store assignment id in "assignment1" from coverage 0
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "assigned",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "coverage_id": "#coverage1#",
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage",
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "507f191e810c19729de870eb",
                    "assignment_id": "#assignment1#"
                }
            }]
        }
        """
        Then we get OK response
        When we get "assignments/#assignment1#"
        Then we get existing resource
        """
        {
            "assigned_to": {
                "state": "assigned",
                "desk": "#desks._id#",
                "user": "507f191e810c19729de870eb"
            }
        }
        """
