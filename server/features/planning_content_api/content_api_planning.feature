Feature: Planning Content API
    Background: Setup publishing resources
        When we configure planning for publishing to capi
        When we post to "planning"
        """
        [{
            "guid": "plan1",
            "slugline": "test-planning-1",
            "planning_date": "2042-01-01T05:00:00+0000",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "coverages": [{
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text",
                    "scheduled": "2042-01-01T07:00:00+0000"
                }
            }]
        }]
        """
        And we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        When we post to "planning"
        """
        [{
            "guid": "plan2",
            "slugline": "test-planning-2",
            "planning_date": "2042-01-02T05:00:00+0000",
            "anpa_category": [{"name": "Finance", "qcode": "finance"}],
            "coverages": [{
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text",
                    "scheduled": "2042-01-02T07:00:00+0000"
                }
            }, {
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "picture",
                    "scheduled": "2042-01-02T08:00:00+0000"
                }
            }]
        }]
        """
        And we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response

    @auth
    Scenario: Planning subscriber permissions
        # Test endpoints when not authenticated
        When we get capi "/planning"
        Then we get error 403
        When we get capi "/planning/plan1"
        Then we get error 403
        When we get capi "/planning/plan2"
        Then we get error 403

        # Test Sports Subscriber
        When we set capi auth token to "#subscriber_token_0._id#"
        When we get capi "/planning"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "plan1", "subscribers": "__no_value__"}
        ]}
        """
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {"_id": "plan1"}
        """
        When we get capi "/planning/plan2"
        Then we get error 404

        # Test Subscriber with access to all content
        When we set capi auth token to "#subscriber_token_1._id#"
        When we get capi "/planning"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "plan1", "subscribers": "__no_value__"},
            {"_id": "plan2", "subscribers": "__no_value__"}
        ]}
        """
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {"_id": "plan1", "subscribers": "__no_value__"}
        """
        When we get capi "/planning/plan2"
        Then we get existing resource
        """
        {"_id": "plan2", "subscribers": "__no_value__"}
        """

    @auth
    Scenario: Search Planning dates
        When we set capi auth token to "#subscriber_token_1._id#"

        # Test start_date and end_date filter (planning_date should match)
        When we get capi "/planning?start_date=2042-01-01&end_date=2042-01-01"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "test-planning-1", "subscribers": "__no_value__"}]}
        """

    @auth
    Scenario: Planning filter search
        When we set capi auth token to "#subscriber_token_1._id#"

        # Test searching using where filter
        When we get capi "/planning?where=slugline==test-planning-1"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "plan1", "slugline": "test-planning-1", "subscribers": "__no_value__"}]}
        """

    @auth
    Scenario: Planning field projection
        When we set capi auth token to "#subscriber_token_1._id#"

        # Test projection
        When we get capi "/planning?include_fields=_id,anpa_category"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "plan1", "slugline": "__no_value__", "subscribers": "__no_value__"},
            {"_id": "plan2", "slugline": "__no_value__", "subscribers": "__no_value__"}
        ]}
        """
        When we get capi "/planning?exclude_fields=slugline"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "plan1", "slugline": "__no_value__", "subscribers": "__no_value__"},
            {"_id": "plan2", "slugline": "__no_value__", "subscribers": "__no_value__"}
        ]}
        """

    @auth
    Scenario: Planning page params
        When we set capi auth token to "#subscriber_token_1._id#"

        When we get capi "/planning?where=slugline==test-planning-1"
        When we get capi "/planning?max_results=1"
        Then we get existing resource
        """
        {
            "_items": [{"_id": "plan1", "subscribers": "__no_value__"}],
            "_meta": {"max_results": 1, "page": 1, "total": 2}
        }
        """
        When we get capi "/planning?max_results=1&page=1"
        Then we get existing resource
        """
        {
            "_items": [{"_id": "plan1", "subscribers": "__no_value__"}],
            "_meta": {"max_results": 1, "page": 1, "total": 2}
        }
        """
        When we get capi "/planning?max_results=1&page=2"
        Then we get existing resource
        """
        {
            "_items": [{"_id": "plan2", "subscribers": "__no_value__"}],
            "_meta": {"max_results": 1, "page": 2, "total": 2}
        }
        """

    @auth
    Scenario: Search parameters on /planning endpoint
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test start_date and end_date filter (planning_date should match)
        When we get capi "/planning?start_date=2042-01-01&end_date=2042-01-01"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "test-planning-1", "subscribers": "__no_value__"}]}
        """

        When we get capi "/planning?start_date=2042-01-02&end_date=2042-01-02"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "test-planning-2", "subscribers": "__no_value__"}]}
        """

        # Test q search
        When we get capi "/planning?q=test-planning-1"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "test-planning-1", "subscribers": "__no_value__"}]}
        """

        # Test include_fields
        When we get capi "/planning?include_fields=slugline"
        Then we get list with 2 items

        # Test exclude_fields
        When we get capi "/planning?exclude_fields=anpa_category"
        Then we get list with 2 items

    @auth
    Scenario: Test ContentAPIPlanningResource model
        Given empty "planning_capi"
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "agenda"
        """
        [{"name": "sports", "is_enabled": true}]
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "guid": "full-plan-1",
            "type": "planning",
            "slugline": "test-full-planning-1",
            "headline": "Testing Full Planning 1",
            "name": "Full Test Plan 1",
            "planning_date": "2042-01-01T05:00:00+0000",
            "firstcreated": "2023-07-01T10:00:00+0000",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "description_text": "Something about something being planned",
            "agendas": ["#agenda._id#"],
            "urgency": 4,
            "coverages": [{
                "coverage_id": "txt-cov-1",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text",
                    "scheduled": "2042-01-01T07:00:00+0000",
                    "genre": [{"name": "Article (news)", "qcode": "Article"}],
                    "keyword": ["test", "keywords"],
                    "language": "en",
                    "workflow_status_reason": "some reason",
                    "priority": 5
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "draft"
                }
            }],
            "extra": {
                "stt_events": "259431",
                "stt_topics": "584717"
            }
        }]
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
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test start_date and end_date filter (planning_date should match)
        When we get capi "/planning"
        Then we get list with 1 items
        """
        {"_items": [{
            "_id": "full-plan-1",
            "subscribers": "__no_value__",
            "type": "planning",
            "products": [{"code": "__objectid__", "name": "sports"}],
            "pubstatus": "usable",
            "slugline": "test-full-planning-1",
            "headline": "Testing Full Planning 1",
            "name": "Full Test Plan 1",
            "planning_date": "2042-01-01T05:00:00+0000",
            "firstcreated": "2023-07-01T10:00:00+0000",
            "versioncreated": "__now__",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "description_text": "Something about something being planned",
            "agendas": [{"_id": "#agenda._id#", "name": "sports"}],
            "urgency": 4,
            "coverages": [{
                "coverage_id": "txt-cov-1",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "draft",
                "planning": {
                    "scheduled": "2042-01-01T07:00:00+0000",
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text",
                    "genre": [{"name": "Article (news)", "qcode": "Article"}],
                    "keyword": ["test", "keywords"],
                    "language": "en",
                    "workflow_status_reason": "some reason",
                    "priority": 5
                },
                "assigned_to": "__no_value__",
                "assigned_user": {"display_name": "test_user"},
                "assigned_desk": {"name": "Sports"}
            }],
            "extra": {
                "stt_events": "259431",
                "stt_topics": "584717"
            }
        }]}
        """

    @auth
    Scenario: Test ContentAPIPlanningResource excludes unknown fields
        When we configure content for publishing
        Given empty "planning"
        And empty "planning_capi"
        And "content_types"
        """
        [{"schema": {"body_html": {}, "slugline": {}, "headline": {}, "ednote": null }}]
        """
        And "content_templates"
        """
        [{
            "template_name": "Default",
            "template_type": "create",
            "data": {"profile": "#content_types._id#"}
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
        When we set capi auth token to "#subscriber_token_0._id#"
        When we post to "planning"
        """
        [{
            "guid": "plan-1",
            "type": "planning",
            "slugline": "test-full-planning-1",
            "headline": "Testing Full Planning 1",
            "planning_date": "2042-01-01T05:00:00+0000",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "internal_note": "something that should NEVER be included",
            "coverages": [{
                "coverage_id": "txt-cov-1",
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "g2_content_type" : "text",
                    "scheduled": "2042-01-01T07:00:00+0000",
                    "internal_note": "something that should NEVER be included"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }]
        """
        Then we get OK response
        Then we store coverage id in "COVERAGE_ID" from coverage 0
        Then we store assignment id in "ASSIGNMENT_ID" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "plan-1",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
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
        When we get capi "/planning/plan-1"
        Then we get existing resource
        """
        {
            "_id": "plan-1",
            "_created": "__no_value__",
            "_updated": "__no_value__",
            "original_creator": "__no_value__",
            "version_creator": "__no_value__",
            "ingest_provider": "__no_value__",
            "internal_note": "__no_value__",
            "coverages": [{
                "coverage_id": "#COVERAGE_ID#",
                "original_creator": "__no_value__",
                "version_creator": "__no_value__",
                "previous_status": "__no_value__",
                "flags": "__no_value__",
                "deliveries": [{
                    "_id": "__no_value__",
                    "item_id": "#ARCHIVE_ID#"
                }],
                "assigned_to": "__no_value__",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "internal_note": "__no_value__"
                }
            }]
        }
        """

    @auth
    Scenario: Date only for Coverage schedule
        When we set capi auth token to "#subscriber_token_0._id#"
        Given empty "planning"
        And empty "planning_capi"
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "planning"
        """
        [{
            "guid": "plan-1",
            "type": "planning",
            "slugline": "test-full-planning-1",
            "headline": "Testing Full Planning 1",
            "planning_date": "2042-01-01T05:00:00+0000",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "coverages": [{
                "coverage_id": "txt-cov-1",
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "_time_to_be_confirmed": true,
                "planning": {
                    "headline": "test headline",
                    "g2_content_type" : "text",
                    "scheduled": "2042-01-01T07:00:00+0000"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }]
        """
        Then we get OK response
        Then we store coverage id in "COVERAGE_1_ID" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "plan-1",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "guid": "plan-2",
            "type": "planning",
            "slugline": "test-full-planning-2",
            "headline": "Testing Full Planning 2",
            "planning_date": "2042-01-02T05:00:00+0000",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "coverages": [{
                "coverage_id": "txt-cov-2",
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "_time_to_be_confirmed": false,
                "planning": {
                    "headline": "test headline",
                    "g2_content_type" : "text",
                    "scheduled": "2042-01-02T07:00:00+0000"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }]
        """
        Then we get OK response
        Then we store coverage id in "COVERAGE_2_ID" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "plan-2",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get capi "/planning/plan-1"
        Then we get existing resource
        """
        {
            "_id": "plan-1",
            "coverages": [{
                "coverage_id": "#COVERAGE_1_ID#",
                "_time_to_be_confirmed": "__no_value__",
                "planning": {"scheduled": "2042-01-01"}
            }]
        }
        """
        When we get capi "/planning/plan-2"
        Then we get existing resource
        """
        {
            "_id": "plan-2",
            "coverages": [{
                "coverage_id": "#COVERAGE_2_ID#",
                "_time_to_be_confirmed": "__no_value__",
                "planning": {"scheduled": "2042-01-02T07:00:00+0000"}
            }]
        }
        """
