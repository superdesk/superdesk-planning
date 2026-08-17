Feature: Coverages are updated when an Assignment is updated
    Background: Initial setup
        Given "users"
        """
        [{"_id": "507f191e810c19729de87034", "name":"testfoo", "email":"foo@122d.com", "username":"johnfoo"}]
        """
        When we post to "desks"
        """
        [
            {"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]},
            {"name": "News", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}
        ]
        """
        Then we get OK response
        And we store "SPORTS_DESK" with first item
        And we store "NEWS_DESK" with 2 item

    @auth
    Scenario: Update Assignment assigned_to and priority updates Coverage
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {
                    "desk": "#SPORTS_DESK._id#",
                    "priority": 3
                },
                "workflow_status": "active"
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we patch "/assignments/#ASSIGNMENT_ID#"
        """
        {"assigned_to": {
            "desk": "#NEWS_DESK._id#",
            "user": "507f191e810c19729de87034"
        }}
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "assigned_to": {
                "desk": "#NEWS_DESK._id#",
                "user": "507f191e810c19729de87034",
                "priority": 3
            }
        }]}
        """

        When we patch "/assignments/#ASSIGNMENT_ID#"
        """
        {"priority": 1}
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "assigned_to": {
                "desk": "#NEWS_DESK._id#",
                "user": "507f191e810c19729de87034",
                "priority": 1
            }
        }]}
        """

    @auth
    Scenario: Update Coverage status when linking content to an Assignment
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#SPORTS_DESK._id#",
                "stage": "#SPORTS_DESK.incoming_stage#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {
                    "desk": "#SPORTS_DESK._id#",
                    "priority": 3
                },
                "workflow_status": "active"
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#ASSIGNMENT_ID#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "assigned_to": {"state": "in_progress"}
        }]}
        """
        When we patch "/archive/#archive._id#"
        """
        {"slugline": "test"}
        """
        Then we get OK response
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "completed"}}
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "assigned_to": {"state": "completed"}
        }]}
        """
        When we post to "assignments/unlink" with success
        """
        [{
            "assignment_id": "#ASSIGNMENT_ID#",
            "item_id": "#archive._id#"
        }]
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "assigned"}}
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "assigned_to": {"state": "assigned"}
        }]}
        """

    @auth
    Scenario: Update Planning autosave when making changes to an Assignment
        Given we have sessions "/sessions"
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {
                    "desk": "#SPORTS_DESK._id#",
                    "priority": 3
                },
                "workflow_status": "active"
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get OK response
        When we post to "/planning_autosave"
        """
        {
            "_id": "#planning._id#",
            "type": "planning",
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "Dont forget stuff",
                    "headline": "Test headline",
                    "slugline": "Test slugline",
                    "fields": [{
                        "field": "location_details",
                        "value": "somewhere in the foo"
                    }, {
                        "field": "my_custom",
                        "value": "bar in the mud"
                    }]
                },
                "assigned_to": {
                    "desk": "#SPORTS_DESK._id#",
                    "priority": 3
                },
                "workflow_status": "active"
            }],
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }
        """
        Then we get OK response
        When we patch "/assignments/#ASSIGNMENT_ID#"
        """
        {"assigned_to": {
            "desk": "#NEWS_DESK._id#",
            "user": "507f191e810c19729de87034"
        }}
        """
        Then we get OK response
        When we get "/planning_autosave/#planning._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "assigned_to": {
                "desk": "#NEWS_DESK._id#",
                "user": "507f191e810c19729de87034"
            },
            "planning": {
                "g2_content_type": "text",
                "ednote": "Dont forget stuff",
                "headline": "Test headline",
                "slugline": "Test slugline",
                "fields": [{
                    "field": "location_details",
                    "value": "somewhere in the foo"
                }, {
                    "field": "my_custom",
                    "value": "bar in the mud"
                }]
            }
        }]}
        """
