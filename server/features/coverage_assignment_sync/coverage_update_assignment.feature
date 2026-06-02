Feature: Assignments updated when Coverages are updated
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
    Scenario: Update coverage updates Assignment without changes to state
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {"desk": "#SPORTS_DESK._id#"},
                "workflow_status": "draft"
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "state": "draft",
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "workflow_status": "draft",
                "assigned_to": {
                    "assignment_id": "#ASSIGNMENT_ID#",
                    "state": "draft",
                    "desk": "#SPORTS_DESK._id#"
                }
            }]
        }
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "state": "draft",
                "desk": "#SPORTS_DESK._id#"
            }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "planning": {
                "g2_content_type": "text",
                "ednote": "Dont forget stuff"
            },
            "assigned_to": {
                "assignment_id": "#ASSIGNMENT_ID#",
                "desk": "#SPORTS_DESK._id#"
            },
            "workflow_status": "draft"
        }]}
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "state": "draft",
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "workflow_status": "draft",
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "Dont forget stuff"
                },
                "assigned_to": {
                    "assignment_id": "#ASSIGNMENT_ID#",
                    "state": "draft",
                    "desk": "#SPORTS_DESK._id#"
                }
            }]
        }
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "state": "draft",
                "desk": "#SPORTS_DESK._id#"
            },
            "planning": {
                "g2_content_type": "text",
                "ednote": "Dont forget stuff"
            }
        }
        """

    @auth
    Scenario: Update Assignment that is in workflow
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {"desk": "#SPORTS_DESK._id#"},
                "workflow_status": "active"
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "state": "assigned",
                "desk": "#SPORTS_DESK._id#"
            },
            "planning": {"g2_content_type": "text"}
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "planning": {
                "g2_content_type": "text",
                "ednote": "Edit my stuff"
            },
            "assigned_to": {
                "assignment_id": "#ASSIGNMENT_ID#",
                "desk": "#SPORTS_DESK._id#"
            }
        }]}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "state": "assigned",
                "desk": "#SPORTS_DESK._id#"
            },
            "planning": {
                "g2_content_type": "text",
                "ednote": "Edit my stuff"
            }
        }
        """

    @auth
    Scenario: Updates Assignment planning metadata when updating a Coverage
        When we post to "/contacts"
        """
        [{"first_name": "Foo", "last_name": "Bar", "public": true}]
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
                "assigned_to": {"desk": "#SPORTS_DESK._id#"},
                "workflow_status": "active"
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "state": "assigned",
                "desk": "#SPORTS_DESK._id#"
            },
            "planning": {"g2_content_type": "text"}
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "planning": {
                "g2_content_type": "text",
                "multiple_content": true,
                "ednote": "Dont forget stuff",
                "headline": "Test headline",
                "slugline": "Test slugline",
                "contact_info": "#contacts._id#",
                "scheduled": "2035-06-30T18:00:00+0000",
                "genre": [{"qcode": "sidebar", "name": "Sidebar"}],
                "language": "fi",
                "priority": 3,
                "internal_note": "We should do stuff",
                "fields": [{
                    "field": "location_details",
                    "value": "somewhere in the foo"
                }, {
                    "field": "my_custom",
                    "value": "bar in the mud"
                }]
            },
            "assigned_to": {
                "assignment_id": "#ASSIGNMENT_ID#",
                "desk": "#SPORTS_DESK._id#",
                "user": "#CONTEXT_USER_ID#",
                "coverage_provider": {"name": "Stringer", "qcode": "stringer"},
                "priority": 1
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "priority": 1,
            "assigned_to": {
                "state": "assigned",
                "desk": "#SPORTS_DESK._id#",
                "user": "#CONTEXT_USER_ID#",
                "coverage_provider": {"name": "Stringer", "qcode": "stringer"},
                "assigned_date_desk": "__now__",
                "assigned_date_user": "__now__",
                "assignor_desk": "#CONTEXT_USER_ID#",
                "assignor_user": "#CONTEXT_USER_ID#"
            },
            "planning": {
                "g2_content_type": "text",
                "multiple_content": true,
                "ednote": "Dont forget stuff",
                "headline": "Test headline",
                "slugline": "Test slugline",
                "contact_info": "#contacts._id#",
                "scheduled": "2035-06-30T18:00:00+0000",
                "genre": [{"qcode": "sidebar", "name": "Sidebar"}],
                "language": "fi",
                "priority": 3,
                "internal_note": "We should do stuff",
                "fields": [{
                    "field": "location_details",
                    "value": "somewhere in the foo"
                }, {
                    "field": "my_custom",
                    "value": "bar in the mud"
                }]
            }
        }
        """

    @auth
    Scenario: Updates Assignment assigned_to when updating a Coverage
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {"desk": "#SPORTS_DESK._id#"},
                "workflow_status": "active"
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "state": "assigned",
                "desk": "#SPORTS_DESK._id#"
            },
            "planning": {"g2_content_type": "text"}
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "assigned_to": {
                "assignment_id": "#ASSIGNMENT_ID#",
                "desk": "#NEWS_DESK._id#",
                "user": "507f191e810c19729de87034"
            },
            "planning": {"g2_content_type": "text"},
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "state": "assigned",
                "desk": "#NEWS_DESK._id#",
                "user": "507f191e810c19729de87034",
                "assigned_date_desk": "__now__",
                "assigned_date_user": "__now__",
                "assignor_desk": "#CONTEXT_USER_ID#",
                "assignor_user": "#CONTEXT_USER_ID#"
            }
        }
        """

    @auth
    @planning_cvs
    Scenario: Updates Assignment when Coverage is cancelled
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {"desk": "#SPORTS_DESK._id#"},
                "workflow_status": "active"
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "state": "assigned",
                "desk": "#SPORTS_DESK._id#"
            },
            "planning": {"g2_content_type": "text"}
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "assigned_to": {
                "assignment_id": "#ASSIGNMENT_ID#",
                "desk": "#SPORTS_DESK._id#",
                "state": "cancelled"
            },
            "planning": {
                "g2_content_type": "text",
                "workflow_status_reason": "Cancelling this one, because ..."
            },
            "workflow_status": "cancelled"
        }]}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "state": "cancelled",
                "desk": "#SPORTS_DESK._id#"
            }
        }
        """
