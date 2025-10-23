Feature: Assignment Revert
    Background: Setup data
        Given "content_types"
        """
        [{"schema": {"body_html": {}, "slugline": {}, "headline": {}, "ednote": null }}]
        """
        Given "content_templates"
        """
        [{"template_name": "Default", "template_type": "create", "data": {}}]
        """
        Given "desks"
        """
        [{
            "name": "Sports Desk",
            "members": [{"user": "#CONTEXT_USER_ID#"}],
            "default_content_template": "#content_templates._id#",
            "default_content_profile": "#content_types._id#"
        }]
        """
        And "planning"
        """
        [{
            "guid": "plan1",
            "headline": "test headline",
            "slugline": "test slugline",
            "state": "scheduled",
            "planning_date": "2016-01-02"
        }]
        """

    @auth
    Scenario: Assignment State goes back to revert_state
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "live_video",
                "scheduled": "2016-01-02T14:00:00+0000"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed",
                "revert_state": "assigned"
            }
        }]}
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we post to "/assignments/#ASSIGNMENT_ID#/lock"
        """
        {"lock_action": "revert"}
        """
        Then we get OK response
        When we perform revert on assignments "#ASSIGNMENT_ID#"
        """
        {}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """

    @auth
    @planning_cvs
    Scenario: Text Assignments cannot be reverted
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "text",
                "scheduled": "2016-01-02T14:00:00+0000"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed",
                "revert_state": "assigned"
            }
        }]}
        """
        Then we get OK response
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we post to "/assignments/#ASSIGNMENT_ID#/lock"
        """
        {"lock_action": "revert"}
        """
        Then we get OK response
        When we perform revert on assignments "#ASSIGNMENT_ID#"
        """
        {}
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: Cannot revert text assignments."}}
        """

    @auth
    @planning_cvs
    Scenario: Text Assignments with multi-content enabled can be reverted
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "text",
                "scheduled": "2016-01-02T14:00:00+0000",
                    "multiple_content": true
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed",
                "revert_state": "assigned"
            }
        }]}
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we post to "/assignments/#ASSIGNMENT_ID#/lock"
        """
        {"lock_action": "revert"}
        """
        Then we get OK response
        When we perform revert on assignments "#ASSIGNMENT_ID#"
        """
        {}
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """

    @auth
    Scenario: Non-Text Assignments should be in completed status for revert action
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "live_video",
                "scheduled": "2016-01-02T14:00:00+0000"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }]}
        """
        Then we get OK response
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we post to "/assignments/#ASSIGNMENT_ID#/lock"
        """
        {"lock_action": "revert"}
        """
        Then we get OK response
        When we perform revert on assignments "#ASSIGNMENT_ID#"
        """
        {}
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: Cannot revert an assignment which is not yet confirmed."}}
        """

    @auth
    @planning_cvs
    Scenario: Text Assignments with multi-content should be in_progress when reverted with content
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "text",
                "scheduled": "2016-01-02T14:00:00+0000",
                "multiple_content": true
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }]}
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0

        # Create the Content from the Assignment
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_1_ID" with value "#content._id#" to context
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Next mark Assignment as completed
        When we post to "/assignments/#ASSIGNMENT_ID#/lock"
        """
        {"lock_action": "complete"}
        """
        Then we get OK response
        When we perform complete on assignments "#ASSIGNMENT_ID#"
        """
        {}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "completed"}}
        """

        # Finally revert the Assignment
        When we post to "/assignments/#ASSIGNMENT_ID#/lock"
        """
        {"lock_action": "revert"}
        """
        Then we get OK response
        When we perform revert on assignments "#ASSIGNMENT_ID#"
        """
        {}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {
            "coverage_item": "#COVERAGE_ID#",
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "in_progress"
            }
        }
        """
