Feature: Assignments created when Coverages are created
    Background: Initial setup
        Given "users"
        """
        [{"_id": "507f191e810c19729de87034", "name":"testfoo", "email":"foo@122d.com", "username":"johnfoo"}]
        """
        When we post to "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        Then we get OK response
        And we store "SPORTS_DESK_ID" with value "#desks._id#" to context

    @auth
    Scenario: Create new planning with draft coverage and no assignee does not create an Assignment
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "workflow_status": "draft"
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And the assignment not created for coverage 0
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "state": "draft",
            "coverages": [{"coverage_id": "#COVERAGE_ID#", "assigned_to": "__no_value__"}]
        }
        """
        When we get "/assignments"
        Then we get list with 0 items

    @auth
    Scenario: Create new planning with draft coverage with desk assignee creates a draft Assignment
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {"desk": "#SPORTS_DESK_ID#"},
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
                "assigned_to": {
                    "assignment_id": "#ASSIGNMENT_ID#",
                    "state": "draft",
                    "desk": "#SPORTS_DESK_ID#"
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
                "desk": "#SPORTS_DESK_ID#"
            }
        }
        """

    @auth
    Scenario: Create new planning with active coverage and desk assignee creates an assigned Assignment
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {"desk": "#SPORTS_DESK_ID#"},
                "workflow_status": "active"
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
                "workflow_status": "active",
                "assigned_to": {
                    "assignment_id": "#ASSIGNMENT_ID#",
                    "state": "assigned",
                    "desk": "#SPORTS_DESK_ID#"
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
                "state": "assigned",
                "desk": "#SPORTS_DESK_ID#"
            }
        }
        """

    @auth
    Scenario: Update planning with new draft coverage and no assignee does not create an Assignment
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {"g2_content_type": "text"},
            "workflow_status": "draft"
        }]}
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And the assignment not created for coverage 0
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "state": "draft",
            "coverages": [{"coverage_id": "#COVERAGE_ID#", "assigned_to": "__no_value__"}]
        }
        """
        When we get "/assignments"
        Then we get list with 0 items

    @auth
    Scenario: Update planning with new draft coverage with desk assignee creates a draft Assignment
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {"g2_content_type": "text"},
            "assigned_to": {"desk": "#SPORTS_DESK_ID#"},
            "workflow_status": "draft"
        }]}
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
                "assigned_to": {
                    "assignment_id": "#ASSIGNMENT_ID#",
                    "state": "draft",
                    "desk": "#SPORTS_DESK_ID#"
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
                "desk": "#SPORTS_DESK_ID#"
            }
        }
        """

    @auth
    Scenario: Update planning with active coverage and desk assignee creates an assigned Assignment
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {"g2_content_type": "text"},
            "assigned_to": {"desk": "#SPORTS_DESK_ID#"},
            "workflow_status": "active"
        }]}
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
                "workflow_status": "active",
                "assigned_to": {
                    "assignment_id": "#ASSIGNMENT_ID#",
                    "state": "assigned",
                    "desk": "#SPORTS_DESK_ID#"
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
                "state": "assigned",
                "desk": "#SPORTS_DESK_ID#"
            }
        }
        """

    @auth
    Scenario: Update coverage and set to active creates an assigned Assignment
        When we post to "/planning"
        """
        [{
            "state": "draft",
            "slugline": "test slugline",
            "planning_date": "2035-06-30T14:00:00+0000",
            "coverages": [{
                "planning": {"g2_content_type": "text"},
                "assigned_to": {"desk": "#SPORTS_DESK_ID#"},
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
                    "desk": "#SPORTS_DESK_ID#"
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
                "desk": "#SPORTS_DESK_ID#"
            }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "planning": {"g2_content_type": "text"},
            "assigned_to": {
                "assignment_id": "#ASSIGNMENT_ID#",
                "desk": "#SPORTS_DESK_ID#"
            },
            "workflow_status": "active"
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
                "workflow_status": "active",
                "assigned_to": {
                    "assignment_id": "#ASSIGNMENT_ID#",
                    "state": "assigned",
                    "desk": "#SPORTS_DESK_ID#"
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
                "state": "assigned",
                "desk": "#SPORTS_DESK_ID#"
            }
        }
        """

    @auth
    Scenario: Copies all metadata from Coverage when creating an Assignment
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
                    "desk": "#SPORTS_DESK_ID#",
                    "user": "#CONTEXT_USER_ID#",
                    "coverage_provider": {"name": "Stringer", "qcode": "stringer"},
                    "priority": 1
                },
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
                "state": "draft",
                "assignment_id": "#ASSIGNMENT_ID#",
                "desk": "#SPORTS_DESK_ID#",
                "user": "#CONTEXT_USER_ID#",
                "coverage_provider": {"name": "Stringer", "qcode": "stringer"},
                "priority": 1,
                "assigned_date_desk": "__now__",
                "assigned_date_user": "__now__",
                "assignor_desk": "#CONTEXT_USER_ID#",
                "assignor_user": "#CONTEXT_USER_ID#"
            },
            "workflow_status": "draft"
        }]}
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "planning_item": "#planning._id#",
            "coverage_item": "#COVERAGE_ID#",
            "priority": 1,
            "assigned_to": {
                "state": "draft",
                "desk": "#SPORTS_DESK_ID#",
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
