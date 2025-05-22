Feature: Planning Content API
    Background: Setup publishing resources
        Given "filter_conditions"
        """
        [
            {"name": "Sports", "field": "anpa_category", "operator": "in", "value": "sports"},
            {"name": "Finance", "field": "anpa_category", "operator": "in", "value": "finance"}
        ]
        """
        And "content_filters"
        """
        [
            {"name": "sports-only", "content_filter": [{"expression": {"fc": ["#filter_conditions_0._id#"]}}]},
            {"name": "finance-only", "content_filter": [{"expression": {"fc": ["#filter_conditions_1._id#"]}}]}
        ]
        """
        And "products"
        """
        [
            {
                "name": "sports", "codes": "sp1,sp2", "product_type": "both",
                "content_filter": {"filter_id": "#content_filters_0._id#", "filter_type": "permitting"}
            },
            {
                "name": "finance", "codes": "fn1,fn2", "product_type": "both",
                "content_filter": {"filter_id": "#content_filters_1._id#", "filter_type": "permitting"}
            }
        ]
        """
        And "subscribers"
        """
        [
            {
                "name": "Sports Subscriber", "subscriber_type": "digital", "email": "sports_api@test.com",
                "is_active": true, "api_products": ["#products_0._id#"]
            },
            {
                "name": "All Subscriber", "subscriber_type": "digital", "email": "public_api@test.com",
                "is_active": true, "api_products": ["#products_0._id#", "#products_1._id#"]
            }
        ]
        """
        And "subscriber_token"
        """
        [
            {"subscriber": "#subscribers_0._id#", "expiry_days": 64},
            {"subscriber": "#subscribers_1._id#", "expiry_days": 128}
        ]
        """

    @auth
    Scenario: Get Planning items
        When we post to "planning"
        """
        [{
            "guid": "plan1",
            "slugline": "test-planning-1",
            "planning_date": "2042-01-01",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}]
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
            "planning_date": "2042-01-02",
            "anpa_category": [{"name": "Finance", "qcode": "finance"}]
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
            {"_id": "plan1"}
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
            {"_id": "plan1"},
            {"_id": "plan2"}
        ]}
        """
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {"_id": "plan1"}
        """
        When we get capi "/planning/plan2"
        Then we get existing resource
        """
        {"_id": "plan2"}
        """
