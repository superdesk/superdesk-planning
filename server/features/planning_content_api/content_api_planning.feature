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
                "news_coverage_status": {"qcode": "ncostat:int"},
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
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text",
                    "scheduled": "2042-01-02T07:00:00+0000"
                }
            }, {
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
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
        Then we get list with 1 items
        """
        {"_items": [{"_id": "plan1", "subscribers": "__no_value__"}]}
        """
        When we get capi "/planning?max_results=1&page=1"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "plan1", "subscribers": "__no_value__"}]}
        """
        When we get capi "/planning?max_results=1&page=2"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "plan2", "subscribers": "__no_value__"}]}
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
