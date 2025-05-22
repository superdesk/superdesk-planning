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

    @auth
    Scenario: Get Event items with subscriber access control
        # Create test events
        When we post to "event"
        """
        [{
            "guid": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "dates": {
                "start": "2042-01-01T10:00:00+0000",
                "end": "2042-01-01T12:00:00+0000"
            },
            "subscribers": ["#subscribers_0._id#", "#subscribers_1._id#"]
        }]
        """
        And we post to "/event/post"
        """
        {
            "event": "#event._id#",
            "etag": "#event._etag#",
            "pubstatus": "usable"
        }
        """
        When we post to "event"
        """
        [{
            "guid": "event2",
            "name": "Finance Event",
            "slugline": "finance-event",
            "anpa_category": [{"name": "Finance", "qcode": "finance"}],
            "dates": {
                "start": "2042-01-02T09:00:00+0000",
                "end": "2042-01-02T11:00:00+0000"
            },
            "subscribers": ["#subscribers_1._id#"]
        }]
        """
        And we post to "/event/post"
        """
        {
            "event": "#event._id#",
            "etag": "#event._etag#",
            "pubstatus": "usable"
        }
        """

        # Test Sports Subscriber (should only see sports event)
        When we set capi auth token to "#subscriber_token_0._id#"
        When we get capi "/event"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event1"}
        ]}
        """
        When we get capi "/event/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}]
        }
        """
        When we get capi "/event/event2"
        Then we get error 404

        # Test Subscriber with access to all content
        When we set capi auth token to "#subscriber_token_1._id#"
        When we get capi "/event"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1"},
            {"_id": "event2"}
        ]}
        """
        When we get capi "/event/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}]
        }
        """
        When we get capi "/event/event2"
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
    Scenario: Search parameters on /events endpoint
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test start_date and end_date filter (dates.start should match)
        When we get capi "/events?start_date=2042-01-01&end_date=2042-01-01"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "test-event-1"}]}
        """

        When we get capi "/events?start_date=2042-01-02&end_date=2042-01-02"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "test-event-2"}]}
        """

        # Test q search
        When we get capi "/events?q=test-event-1"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "test-event-1"}]}
        """

        # Test include_fields
        When we get capi "/events?include_fields=slugline"
        Then we get list with 2 items

        # Test exclude_fields
        When we get capi "/events?exclude_fields=anpa_category"
        Then we get list with 2 items

