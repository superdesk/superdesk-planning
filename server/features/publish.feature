Feature: Publish

    @auth
    Scenario: Publish Event
        When we post to "/products" with success
        """
        {
            "name":"prod-1","codes":"abc,xyz", "product_type": "both"
        }
        """
        And we post to "/subscribers" with success
        """
        {
            "name":"News1","media_type":"media", "subscriber_type": "digital", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
            "products": ["#products._id#"],
            "codes": "xyz, abc",
            "destinations": [{"name":"events", "format": "ntb_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
        }
        """
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        When we post to "/events" with success
        """
        {
            "guid": "123",
            "unique_id": "123",
            "unique_name": "123 name",
            "name": "event 123",
            "slugline": "event-123",
            "definition_short": "short value",
            "definition_long": "long value",
            "relationships":{
                "broader": "broader value",
                "narrower": "narrower value",
                "related": "related value"
            },
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "subject": [{"qcode": "test qcaode", "name": "test name"}],
            "location": [{"qcode": "test qcaode", "name": "test name"}],
            "event_contact_info": ["#contacts._id#"]
        }
        """

        When we post to "/events/publish"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {"state": "scheduled"}
        """

        When we get "publish_queue"
        Then we get list with 1 items
        When we transmit items
        Then file exists "/tmp/123-1-None.txt"

    @auth
    Scenario: Publish non existing event
        When we post to "/events/publish"
        """
        {"event": "foo", "etag": "foo"}
        """
        Then we get error 400
        """
        {"_issues": {"event": "__any_value__"}}
        """


    @auth
    Scenario: Fail to publish Event with insufficient privileges
    When we post to "/products" with success
    """
    {
        "name":"prod-1","codes":"abc,xyz", "product_type": "both"
    }
    """
    And we post to "/subscribers" with success
    """
    {
        "name":"News1","media_type":"media", "subscriber_type": "digital", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
        "products": ["#products._id#"],
        "codes": "xyz, abc",
        "destinations": [{"name":"events", "format": "ntb_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
    }
    """
    Given "contacts"
    """
        [{"first_name": "Albert", "last_name": "Foo"}]
    """
    When we post to "/events" with success
    """
    {
        "guid": "123",
        "unique_id": "123",
        "unique_name": "123 name",
        "name": "event 123",
        "slugline": "event-123",
        "definition_short": "short value",
        "definition_long": "long value",
        "pubstatus": "usable",
        "relationships":{
            "broader": "broader value",
            "narrower": "narrower value",
            "related": "related value"
        },
        "dates": {
            "start": "2016-01-02",
            "end": "2016-01-03"
        },
        "subject": [{"qcode": "test qcaode", "name": "test name"}],
        "location": [{"qcode": "test qcaode", "name": "test name"}],
        "event_contact_info": ["#contacts._id#"]
    }
    """
    When we patch "/users/#CONTEXT_USER_ID#"
    """
    {"user_type": "user", "privileges": {"planning_event_publish": 0, "users": 1}}
    """
    When we post to "/events/publish"
    """
    {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
    """
    Then we get error 403

    @auth
    Scenario: Publish cancelled event
        When we post to "/products" with success
        """
        {
            "name":"prod-1","codes":"abc,xyz", "product_type": "both"
        }
        """
        And we post to "/subscribers" with success
        """
        {
            "name":"News1","media_type":"media", "subscriber_type": "digital", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
            "products": ["#products._id#"],
            "codes": "xyz, abc",
            "destinations": [{"name":"events", "format": "ntb_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
        }
        """
        Given "contacts"
        """
            [{"first_name": "Albert", "last_name": "Foo"}]
        """
        When we post to "/events" with success
        """
        {
            "guid": "123",
            "unique_id": "123",
            "unique_name": "123 name",
            "name": "event 123",
            "slugline": "event-123",
            "definition_short": "short value",
            "definition_long": "long value",
            "pubstatus": "cancelled",
            "relationships":{
                "broader": "broader value",
                "narrower": "narrower value",
                "related": "related value"
            },
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "subject": [{"qcode": "test qcaode", "name": "test name"}],
            "location": [{"qcode": "test qcaode", "name": "test name"}],
            "event_contact_info": ["#contacts._id#"]
        }
        """

        When we post to "/events/publish"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "cancelled"}
        """
        Then we get OK response

        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {"state": "killed"}
        """

        When we transmit items
        Then file exists "/tmp/123-1-None.txt"
