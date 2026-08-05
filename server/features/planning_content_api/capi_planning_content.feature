Feature: Planning & Content ContentAPI
    Background:
        When we configure content for publishing
        And we configure planning for publishing
        And we configure planning for publishing to capi
        When we set capi auth token to "#subscriber_token_0._id#"
        Given "content_types"
        """
        [{"schema": {"body_html": {}, "slugline": {}, "headline": {}, "ednote": null }}]
        """
        And "content_templates"
        """
        [{
            "template_name": "Default",
            "template_type": "create",
            "data": {
                "profile": "#content_types._id#",
                "anpa_category": [{"name": "Sports", "qcode": "sports"}]
            }
        }]
        """
        And "desks"
        """
        [{
            "name": "Sports",
            "default_content_template": "#content_templates._id#",
            "default_content_profile": "#content_types._id#",
            "members": [{"user": "#CONTEXT_USER_ID#"}]
        }]
        """
        When we post to "planning"
        """
        [{
            "guid": "plan1",
            "headline": "Sporting Plan 1",
            "slugline": "sporting-plan-1",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "planning_date": "2042-01-01T10:00:00+0000",
            "coverages": [{
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "headline": "Sporting Plan 1",
                    "slugline": "sporting-plan-1"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "priority": 2
                }
            }]
        }]
        """
        Then we get OK response
        Then we store coverage id in "COVERAGE_ID" from coverage 0
        Then we store assignment id in "ASSIGNMENT_ID" from coverage 0

    @auth
    Scenario: Post planning first then post linked content
        When we post to "/planning/post"
        """
        {"planning": "plan1", "etag": "#planning._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "workflow_status": "assigned",
                "deliveries": "__empty__"
            }]
        }
        """
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        And we store "ARCHIVE_ID" with value "#content._id#" to context
        When we publish "#ARCHIVE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "workflow_status": "completed",
                "deliveries": [
                    {"item_id": "#ARCHIVE_ID#", "item_state": "published", "sequence_no": 0}
                ]
            }]
        }
        """
        When we get capi "/items/#ARCHIVE_ID#"
        Then we get existing resource
        """
        {"planning_id": "plan1", "coverage_id": "#COVERAGE_ID#"}
        """

    @auth
    Scenario: Post content first then post linked Planning
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        And we store "ARCHIVE_ID" with value "#content._id#" to context
        When we publish "#ARCHIVE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we post to "/planning/post"
        """
        {"planning": "plan1", "etag": "#planning._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {
            "_id": "plan1",
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "workflow_status": "completed",
                "deliveries": [
                    {"item_id": "#ARCHIVE_ID#", "item_state": "published", "sequence_no": 0}
                ]
            }]
        }
        """
        When we get capi "/items/#ARCHIVE_ID#"
        Then we get existing resource
        """
        {"planning_id": "plan1", "coverage_id": "#COVERAGE_ID#"}
        """

    @auth
    Scenario: Link content after publishing both
        When we post to "/planning/post"
        """
        {"planning": "plan1", "etag": "#planning._etag#", "pubstatus": "usable"}
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
            },
            "state": "in_progress"
        }]
        """
        Then we get OK response
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "workflow_status": "assigned",
                "deliveries": "__empty__"
            }]
        }
        """
        When we get capi "/items/#archive._id#"
        Then we get existing resource
        """
        {"planning_id": "__no_value__", "coverage_id": "__no_value__"}
        """
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#ASSIGNMENT_ID#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "workflow_status": "completed",
                "deliveries": [
                    {"item_id": "#archive._id#", "item_state": "published", "sequence_no": 0}
                ]
            }]
        }
        """
        When we get capi "/items/#archive._id#"
        Then we get existing resource
        """
        {"planning_id": "plan1", "coverage_id": "#COVERAGE_ID#"}
        """

    @auth
    Scenario: Post Planning with content updates
        When we post to "/planning/post"
        """
        {"planning": "plan1", "etag": "#planning._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_ID#"}]
        """
        Then we get OK response
        And we store "ARCHIVE_ID" with value "#content._id#" to context
        When we publish "#ARCHIVE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we rewrite "#ARCHIVE_ID#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {
            "_id": "plan1",
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "workflow_status": "completed",
                "deliveries": [
                    {"item_id": "#ARCHIVE_ID#", "item_state": "published", "sequence_no": 0},
                    {"item_id": "#REWRITE_ID#", "item_state": "published", "sequence_no": 1}
                ]
            }]
        }
        """
        When we get capi "/items/#ARCHIVE_ID#"
        Then we get existing resource
        """
        {"planning_id": "plan1", "coverage_id": "#COVERAGE_ID#"}
        """
        When we get capi "/items/#REWRITE_ID#"
        Then we get existing resource
        """
        {"planning_id": "plan1", "coverage_id": "#COVERAGE_ID#"}
        """
