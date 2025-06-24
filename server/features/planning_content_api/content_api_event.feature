Feature: Events Content API
    Background: Setup publishing resources
        When we configure planning for publishing to capi

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
            {"_id": "event1", "subscribers": "__no_value__"}
        ]}
        """
        When we get capi "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "subscribers": "__no_value__"
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
            {"_id": "event1", "subscribers": "__no_value__"},
            {"_id": "event2", "subscribers": "__no_value__"}
        ]}
        """
        When we get capi "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "subscribers": "__no_value__"
        }
        """
        When we get capi "/events/event2"
        Then we get existing resource
        """
        {
            "_id": "event2",
            "name": "Finance Event",
            "slugline": "finance-event",
            "anpa_category": [{"name": "Finance", "qcode": "finance"}],
            "subscribers": "__no_value__"
        }
        """

    @auth
    Scenario: Search Event dates
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test start_date and end_date filter (dates.start should match)
        When we get capi "/events?start_date=2042-01-01&end_date=2042-01-01"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "sports-event", "subscribers": "__no_value__"}]}
        """

        When we get capi "/events?start_date=2042-01-02&end_date=2042-01-02"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "finance-event", "subscribers": "__no_value__"}]}
        """

    @auth
    Scenario: Event filter search
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test q search
        When we get capi "/events?q=sports-event"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "sports-event", "subscribers": "__no_value__"}]}
        """

    @auth
    Scenario: Event field projection
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test include_fields
        When we get capi "/events?include_fields=slugline"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1", "slugline": "sports-event", "anpa_category": "__no_value__", "subscribers": "__no_value__"},
            {"_id": "event2", "slugline": "finance-event", "anpa_category": "__no_value__", "subscribers": "__no_value__"}
        ]}
        """
        When we get capi "/events?exclude_fields=anpa_category"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1", "slugline": "sports-event", "anpa_category": "__no_value__", "subscribers": "__no_value__"},
            {"_id": "event2", "slugline": "finance-event", "anpa_category": "__no_value__", "subscribers": "__no_value__"}
        ]}
        """

    @auth
    Scenario: Event page params
        When we set capi auth token to "#subscriber_token_1._id#"
        When we get capi "/events?max_results=1"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event1", "subscribers": "__no_value__"}]}
        """
        When we get capi "/events?max_results=1&page=1"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event1", "subscribers": "__no_value__"}]}
        """
        When we get capi "/events?max_results=1&page=2"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event2", "subscribers": "__no_value__"}]}
        """

    @auth
    Scenario: Post an Event with a file attached
        When we upload a file "bike.jpg" to "/events_files"
        When we post to "events"
        """
        [{
            "guid": "event3",
            "name": "Sports Event with file attachment",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "dates": {
                "start": "2042-01-01T10:00:00+0000",
                "end": "2042-01-01T12:00:00+0000"
            },
            "files": ["#events_files._id#"]
        }]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "event3",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we set capi auth token to "#subscriber_token_0._id#"
        When we get capi "/events/event3"
        Then we get existing resource
        """
        {
            "_id": "event3",
            "files": [{"name": "bike.jpg", "mimetype": "image/jpeg"}],
            "subscribers": "__no_value__"
        }
        """
