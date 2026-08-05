Feature: Assignment with multiple linked content
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
        }, {
            "name": "Finance Desk",
            "members": [{"user": "#CONTEXT_USER_ID#"}],
            "default_content_template": "#content_templates._id#",
            "default_content_profile": "#content_types._id#"
        }]
        """
        When we post to "planning"
        """
        [{
            "slugline": "test slugline",
            "planning_date": "2042-06-30",
            "coverages": [{
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
        And we store coverage id in "COVERAGE_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "planning": {"multiple_content": true},
            "assigned_to": {"assignment_id": "#ASSIGNMENT_ID#", "state": "assigned"}
        }]}
        """
        When we get "/assignments_history"
        Then we get list with 1 items
        """
        {"_items": [{"assignment_id": "#ASSIGNMENT_ID#", "operation": "create"}]}
        """

    @auth
    Scenario: Coverage without multiple_content enabled fails with start working
        When we post to "planning"
        """
        {
            "slugline": "test slugline",
            "planning_date": "2042-06-30",
            "coverages": [{
                "planning": {
                    "slugline": "test slugline",
                    "g2_content_type": "text",
                    "multiple_content": false
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                },
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "workflow_status": "assigned"
            }]
        }
        """
        Then we get OK response
        And we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get error 400
        """
        {"_message": "Assignment workflow started. Cannot create content."}
        """

    @auth
    Scenario: Can start working multiple times on a Coverage
        # Make sure the Assignment is in ``assigned`` state
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "assigned"}}
        """

        # Create the 1st content item and make sure Assignment is in ``in_progress`` state
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_1_ID" with value "#content._id#" to context
        Then we get existing resource
        """
        {"_id": "#CONTENT_1_ID#", "assignment_id": "#ASSIGNMENT_ID#"}
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Create the 2nd content item and make sure Assignment stays in ``in_progress`` state
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_2_ID" with value "#content._id#" to context
        Then we get existing resource
        """
        {"_id": "#CONTENT_2_ID#", "assignment_id": "#ASSIGNMENT_ID#"}
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Check Assignment history contains all entries
        When we get "/assignments_history"
        Then we get list with 3 items
        """
        {"_items": [
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "create"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "start_working"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "start_working"}
        ]}
        """

    @auth
    Scenario: Publishing content does not mark Assignment as completed
        When we configure content for publishing
        And we configure planning for publishing
        # Create 2 content items
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_1_ID" with value "#content._id#" to context
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_2_ID" with value "#content._id#" to context
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Publish the 1st content item and make sure the Assignment stays in ``in_progress`` state
        When we patch "/archive/#CONTENT_1_ID#"
        """
        {"headline": "test content 1"}
        """
        Then we get OK response
        When we publish "#CONTENT_1_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Publish the 2nd content item and make sure the Assignment stays in ``in_progress`` state
        When we patch "/archive/#CONTENT_2_ID#"
        """
        {"headline": "test content 2"}
        """
        Then we get OK response
        When we publish "#CONTENT_2_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Check Assignment history contains all entries
        When we get "/assignments_history"
        Then we get list with 3 items
        """
        {"_items": [
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "create"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "start_working"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "start_working"}
        ]}
        """

    @auth
    Scenario: Confirm then revert availability of Assignment keeps links to content items
        # Create 2 content items
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_1_ID" with value "#content._id#" to context
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_2_ID" with value "#content._id#" to context
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # First mark Assignment as completed
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
        {"assigned_to": {"state": "completed", "revert_state": "in_progress"}, "lock_action": "__none__"}
        """
        When we get "/archive"
        Then we get list with 2 items
        """
        {
        "_items": [
            {"_id": "#CONTENT_1_ID#", "assignment_id": "#ASSIGNMENT_ID#"},
            {"_id": "#CONTENT_2_ID#", "assignment_id": "#ASSIGNMENT_ID#"}
        ]}
        """

        # Now revert the Assignment availability
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
        {"assigned_to": {"state": "in_progress"}, "lock_action": "__none__"}
        """
        When we get "/archive"
        Then we get list with 2 items
        """
        {
        "_items": [
            {"_id": "#CONTENT_1_ID#", "assignment_id": "#ASSIGNMENT_ID#"},
            {"_id": "#CONTENT_2_ID#", "assignment_id": "#ASSIGNMENT_ID#"}
        ]}
        """

        # Check Assignment history contains all entries
        When we get "/assignments_history"
        Then we get list with 5 items
        """
        {"_items": [
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "create"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "start_working"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "start_working"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "confirm"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "revert"}
        ]}
        """

    @auth
    Scenario: Can link multiple content to an Assignment
        # Create 2 content items
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline 1",
            "slugline": "test slugline",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}
        }]
        """
        Then we get OK response
        And we store "CONTENT_1_ID" with value "#archive._id#" to context
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline 2",
            "slugline": "test slugline",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}
        }]
        """
        Then we get OK response
        And we store "CONTENT_2_ID" with value "#archive._id#" to context

        # Link both content items to the Assignment
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#ASSIGNMENT_ID#",
            "item_id": "#CONTENT_1_ID#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#ASSIGNMENT_ID#",
            "item_id": "#CONTENT_2_ID#",
            "reassign": true
        }]
        """
        Then we get OK response

        # Check both content is linked to Assignment, and Assignment is moved to in_progress
        When we get "/archive"
        Then we get list with 2 items
        """
        {
        "_items": [
            {"_id": "#CONTENT_1_ID#", "assignment_id": "#ASSIGNMENT_ID#"},
            {"_id": "#CONTENT_2_ID#", "assignment_id": "#ASSIGNMENT_ID#"}
        ]}
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Unlink 1 of the content from the Assignment, make sure Assignment says in_progress
        When we post to "assignments/unlink" with success
        """
        [{
            "assignment_id": "#ASSIGNMENT_ID#",
            "item_id": "#CONTENT_1_ID#"
        }]
        """
        When we get "/archive"
        Then we get list with 2 items
        """
        {
        "_items": [
            {"_id": "#CONTENT_1_ID#", "assignment_id": "__none__"},
            {"_id": "#CONTENT_2_ID#", "assignment_id": "#ASSIGNMENT_ID#"}
        ]}
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Unlink the 2nd content from the Assignment, make sure Assignment moved to assigned
        When we post to "assignments/unlink" with success
        """
        [{
            "assignment_id": "#ASSIGNMENT_ID#",
            "item_id": "#CONTENT_2_ID#"
        }]
        """
        When we get "/archive"
        Then we get list with 2 items
        """
        {
        "_items": [
            {"_id": "#CONTENT_1_ID#", "assignment_id": "__none__"},
            {"_id": "#CONTENT_2_ID#", "assignment_id": "__none__"}
        ]}
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "assigned"}}
        """

        # Check Assignment history contains all entries
        When we get "/assignments_history"
        Then we get list with 5 items
        """
        {"_items": [
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "create"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "content_link"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "content_link"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "unlink"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "unlink"}
        ]}
        """

    @auth
    Scenario: Can spike multiple content from an Assignment
        # Create 2 content items
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_1_ID" with value "#content._id#" to context
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_2_ID" with value "#content._id#" to context
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Spike 1st content item
        When we spike "#CONTENT_1_ID#"
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

        # Spike 2nd content item
        When we spike "#CONTENT_2_ID#"
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "assigned"}}
        """

        # Check Assignment history contains all entries
        When we get "/assignments_history"
        Then we get list with 5 items
        """
        {"_items": [
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "create"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "start_working"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "start_working"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "spike_unlink"},
            {"assignment_id": "#ASSIGNMENT_ID#", "operation": "spike_unlink"}
        ]}
        """

    @auth
    Scenario: Multi content locks are not synced with Assignment
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_1_ID" with value "#content._id#" to context
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        Then we store "CONTENT_2_ID" with value "#content._id#" to context
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"lock_action": "__none__"}
        """

        # Lock 1st content
        When we post to "/archive/#CONTENT_1_ID#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"lock_action": "__none__"}
        """

        # Lock 2nd content
        When we post to "/archive/#CONTENT_2_ID#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"lock_action": "__none__"}
        """

        # Unlock 1st content
        When we post to "/archive/#CONTENT_1_ID#/unlock"
        """
        {}
        """
        Then we get OK response
        Then we get existing resource
        """
        {"lock_action": "__none__"}
        """

        # Unlock 2nd content
        When we post to "/archive/#CONTENT_2_ID#/unlock"
        """
        {}
        """
        Then we get OK response
        Then we get existing resource
        """
        {"lock_action": "__none__"}
        """

    @auth
    Scenario: Sending to desk keeps assignment in progress
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

        When we post to "desks"
        """
        {"name": "Finance"}
        """
        Then we get ok response

        When we post to "/archive/#CONTENT_1_ID#/move"
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """

        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

    @auth
    Scenario: Linking a published article to assignment does not complete it
        When we configure content for publishing
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline 1",
            "slugline": "test slugline",
            "state": "in_progress",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}
        }]
        """
        Then we get OK response
        And we store "CONTENT_1_ID" with value "#archive._id#" to context
        When we publish "#CONTENT_1_ID#" with "publish" type and "published" state
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#ASSIGNMENT_ID#",
            "item_id": "#CONTENT_1_ID#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we get "/archive/#CONTENT_1_ID#"
        Then we get existing resource
        """
        {"_id": "#CONTENT_1_ID#", "assignment_id": "#ASSIGNMENT_ID#"}
        """
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """

    @auth
    Scenario: Updating article to different desk does not re-assign the assignment
        When we configure content for publishing
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        And we store "CONTENT_1_ID" with value "#content._id#" to context
        When we patch "/archive/#CONTENT_1_ID#"
        """
        {"headline": "test content 1"}
        """
        Then we get OK response
        When we publish "#CONTENT_1_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress", "desk": "#desks_1._id#"}}
        """
        When we rewrite "#CONTENT_1_ID#"
        """
        {"desk_id": "#desks_0._id#"}
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress", "desk": "#desks_1._id#"}}
        """
        When we get "/archive/#CONTENT_1_ID#"
        Then we get existing resource
        """
        {"task": {"desk": "#desks_1._id#"}}
        """
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {"task": {"desk": "#desks_0._id#"}}
        """

    @auth
    @vocabularies
    Scenario: Desk re-assignment not allowed if multiple_content disabled when assignment is in progress or submitted
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "planning": {
                "slugline": "test slugline",
                "g2_content_type": "text",
                "multiple_content": false
            },
            "assigned_to": {
                "assignment_id": "#ASSIGNMENT_ID#",
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            },
            "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
            "workflow_status": "assigned"
        }]}
        """
        Then we get OK response

        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        When we get "/assignments/#ASSIGNMENT_ID#"
        Then we get existing resource
        """
        {"assigned_to": {"state": "in_progress"}}
        """
        When we patch "/assignments/#ASSIGNMENT_ID#"
        """
        {"assigned_to": {"desk": "#desks_0._id#", "user": "#CONTEXT_USER_ID#"}}
        """
        Then we get error 400
