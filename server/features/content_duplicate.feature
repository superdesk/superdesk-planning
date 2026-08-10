Feature: Assignment with multiple linked content
    Background: Setup Planning, Assignments and Content
        Given "content_types"
        """
        [{"schema": {"body_html": {}, "slugline": {}, "headline": {}, "ednote": null }}]
        """
        And "content_templates"
        """
        [{"template_name": "Default", "template_type": "create", "data": {}}]
        """
        And "desks"
        """
        [{
            "name": "Sports Desk", "members": [{"user": "#CONTEXT_USER_ID#"}],
            "default_content_template": "#content_templates._id#",
            "default_content_profile": "#content_types._id#"
        }]
        """
        When we post to "planning"
        """
        [{
            "guid": "plan1",
            "slugline": "test slugline",
            "planning_date": "2042-06-30",
            "coverages": [{
                "coverage_id": "txt-single",
                "planning": {
                    "slugline": "test slugline",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                },
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "workflow_status": "assigned"
            }, {
                "coverage_id": "txt-multi",
                "planning": {
                    "slugline": "test slugline",
                    "g2_content_type": "text",
                    "multiple_content": true
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                },
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "workflow_status": "assigned"
            }]
        }]
        """
        Then we get OK response
        And we store assignment id in "SINGLE_ASSIGNMENT_ID" from coverage 0
        And we store assignment id in "MULTI_ASSIGNMENT_ID" from coverage 1

        # Create the initial 2 content items
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#SINGLE_ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "SINGLE_CONTENT_1_ID" with value "#content._id#" to context
        Then we get existing resource
        """
        {"_id": "#SINGLE_CONTENT_1_ID#", "assignment_id": "#SINGLE_ASSIGNMENT_ID#"}
        """

        When we post to "/assignments/content"
        """
        [{"assignment_id": "#MULTI_ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "MULTI_CONTENT_1_ID" with value "#content._id#" to context
        Then we get existing resource
        """
        {"_id": "#MULTI_CONTENT_1_ID#", "assignment_id": "#MULTI_ASSIGNMENT_ID#"}
        """

    @auth @planning_cvs
    Scenario: Duplicating content removes assignment id
        # Duplicate content from Assignment with multiple_content disabled
        When we post to "/archive/#SINGLE_CONTENT_1_ID#/duplicate"
        """
        {"desk": "#desks._id#","type": "archive"}
        """
        Then we get OK response
        Then we store "SINGLE_CONTENT_2_ID" with value "#duplicate._id#" to context

        # Duplicate content from Assignment with multiple_content enabled
        When we post to "/archive/#MULTI_CONTENT_1_ID#/duplicate"
        """
        {"desk": "#desks._id#","type": "archive"}
        """
        Then we get OK response
        Then we store "MULTI_CONTENT_2_ID" with value "#duplicate._id#" to context

        # Check all items from archive endpoint
        When we get "archive"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#SINGLE_CONTENT_1_ID#", "assignment_id": "#SINGLE_ASSIGNMENT_ID#"},
            {"_id": "#SINGLE_CONTENT_2_ID#", "assignment_id": "__none__"},
            {"_id": "#MULTI_CONTENT_1_ID#", "assignment_id": "#MULTI_ASSIGNMENT_ID#"},
            {"_id": "#MULTI_CONTENT_2_ID#", "assignment_id": "__none__"}
        ]}
        """

    @auth @planning_cvs
    Scenario: Duplicating content links to existing Assignment
        Given config update
        """
        {"ASSIGNMENT_LINK_DUPLICATE_CONTENT": true}
        """
        # Duplicate content from Assignment with multiple_content disabled
        When we post to "/archive/#SINGLE_CONTENT_1_ID#/duplicate"
        """
        {"desk": "#desks._id#","type": "archive"}
        """
        Then we get OK response
        Then we store "SINGLE_CONTENT_2_ID" with value "#duplicate._id#" to context

        # Duplicate content from Assignment with multiple_content enabled
        When we post to "/archive/#MULTI_CONTENT_1_ID#/duplicate"
        """
        {"desk": "#desks._id#","type": "archive"}
        """
        Then we get OK response
        Then we store "MULTI_CONTENT_2_ID" with value "#duplicate._id#" to context

        # Check all items from archive endpoint
        When we get "archive"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#SINGLE_CONTENT_1_ID#", "assignment_id": "#SINGLE_ASSIGNMENT_ID#"},
            {"_id": "#SINGLE_CONTENT_2_ID#", "assignment_id": "__none__"},
            {"_id": "#MULTI_CONTENT_1_ID#", "assignment_id": "#MULTI_ASSIGNMENT_ID#"},
            {"_id": "#MULTI_CONTENT_2_ID#", "assignment_id": "#MULTI_ASSIGNMENT_ID#"}
        ]}
        """

    @auth @planning_cvs
    Scenario: Duplicating content to personal space removes Assignment ID
        Given config update
        """
        {"ASSIGNMENT_LINK_DUPLICATE_CONTENT": true}
        """
        When we post to "/archive/#MULTI_CONTENT_1_ID#/duplicate"
        """
        {"desk": null,"type": "archive"}
        """
        Then we get OK response
        Then we store "MULTI_CONTENT_2_ID" with value "#duplicate._id#" to context
        When we get "archive"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#MULTI_CONTENT_1_ID#", "assignment_id": "#MULTI_ASSIGNMENT_ID#"},
            {"_id": "#MULTI_CONTENT_2_ID#", "assignment_id": "__none__"}
        ]}
        """
