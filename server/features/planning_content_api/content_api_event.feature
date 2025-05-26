Feature: Events Content API
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

        # Create test events
        When we post to "events"
        """
        [{
            "guid": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "dates": {
                "start": "2042-01-01T10:00:00+0000",
                "end": "2042-01-01T12:00:00+0000"
            }
        }]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we post to "events"
        """
        [{
            "guid": "event2",
            "name": "Finance Event",
            "slugline": "finance-event",
            "anpa_category": [{"name": "Finance", "qcode": "finance"}],
            "dates": {
                "start": "2042-01-02T09:00:00+0000",
                "end": "2042-01-02T11:00:00+0000"
            }
        }]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response

    @auth
    Scenario: Event subscriber permissions
        # Test endpoints when not authenticated
        When we get capi "/events"
        Then we get error 403
        When we get capi "/events/event1"
        Then we get error 403
        When we get capi "/events/event2"
        Then we get error 403

        # Test Sports Subscriber (should only see sports event)
        When we set capi auth token to "#subscriber_token_0._id#"
        When we get capi "/events"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event1"}
        ]}
        """
        When we get capi "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}]
        }
        """
        When we get capi "/events/event2"
        Then we get error 404

        # Test Subscriber with access to all content
        When we set capi auth token to "#subscriber_token_1._id#"
        When we get capi "/events"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1"},
            {"_id": "event2"}
        ]}
        """
        When we get capi "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}]
        }
        """
        When we get capi "/events/event2"
        Then we get existing resource
        """
        {
            "_id": "event2",
            "name": "Finance Event",
            "slugline": "finance-event",
            "anpa_category": [{"name": "Finance", "qcode": "finance"}]
        }
        """

    @auth
    Scenario: Search Event dates
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test start_date and end_date filter (dates.start should match)
        When we get capi "/events?start_date=2042-01-01&end_date=2042-01-01"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "sports-event"}]}
        """

        When we get capi "/events?start_date=2042-01-02&end_date=2042-01-02"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "finance-event"}]}
        """

    @auth
    Scenario: Event filter search
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test q search
        When we get capi "/events?q=sports-event"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "sports-event"}]}
        """

    @auth
    Scenario: Event field projection
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test include_fields
        When we get capi "/events?include_fields=slugline"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1", "slugline": "sports-event", "anpa_category": "__no_value__"},
            {"_id": "event2", "slugline": "finance-event", "anpa_category": "__no_value__"}
        ]}
        """

        # Test exclude_fields        When we get capi "/events?exclude_fields=anpa_category"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1", "slugline": "sports-event", "anpa_category": "__no_value__"},
            {"_id": "event2", "slugline": "finance-event", "anpa_category": "__no_value__"}
        ]}
        """

    @auth
    Scenario: Event page params
        When we set capi auth token to "#subscriber_token_1._id#"
        When we get capi "/events?max_results=1"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event1"}]}
        """
        When we get capi "/events?max_results=1&page=1"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event1"}]}
        """
        When we get capi "/events?max_results=1&page=2"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event2"}]}
        """
