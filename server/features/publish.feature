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
            "destinations": [{"name":"events", "format": "json_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
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
        Then we get OK response
        When we upload a file "bike.jpg" to "/events_files"
        Then we get OK response
        And we store "FILE" from patch
        When we patch "/events/#events._id#"
        """
        {
            "files": ["#FILE._id#"],
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }
        """
        Then we get updated response
        """
        {"files": ["#FILE._id#"], "_id": "#events._id#"}
        """
        When we post to "/events/post"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {"state": "scheduled"}
        """
        When we get "published_planning"
        Then we get list with 1 items

        When we get "publish_queue"
        Then we get list with 1 items
        Then we store "PUBLISHQUEUE" with first item
        When we transmit items
        Then versioned file exists "/tmp/123-#PUBLISHQUEUE.item_version#-1.txt"
        When we get "published_planning?where={\"item_id\": \"#PUBLISHQUEUE.item_id#\", \"version\": #PUBLISHQUEUE.item_version#}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#events._id#",
                    "type": "event",
                    "published_item": {
                        "_id": "#events._id#",
                        "files": ["#FILE._id#"]
                    }
                }
            ]
        }
        """
        When we get "published_planning?where={\"item_id\": \"#PUBLISHQUEUE.item_id#\", \"version\": #PUBLISHQUEUE.item_version#}&embedded={"files": 1}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#events._id#",
                    "type": "event",
                    "published_item": {
                        "_id": "#events._id#",
                        "files": [{"_id": "#FILE._id#", "media": {"_id": "#FILE.media._id#"}}]
                    }
                }
            ]
        }
        """

    @auth
    Scenario: Publish Event using json event formatter
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
            "destinations": [{"name":"events", "format": "json_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
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

        When we post to "/events/post"
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
        And we get "usable" in formatted output
        And we get "scheduled" in formatted output
        When we transmit items
        When we get "publish_queue"
        Then we get existing resource
        """
            {"_items": [{"state": "success"}]}
        """
        Then we store "PUBLISHQUEUE" with first item
        Then versioned file exists "/tmp/123-#PUBLISHQUEUE.item_version#-1.txt"

    @auth
    Scenario: Post non existing event
        When we post to "/events/post"
        """
        {"event": "foo", "etag": "foo"}
        """
        Then we get error 400
        """
        {"_issues": {"event": "__any_value__"}}
        """


    @auth
    Scenario: Fail to post Event with insufficient privileges
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
        "destinations": [{"name":"events", "format": "json_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
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
    {"user_type": "user", "privileges": {"planning_event_post": 0, "users": 1}}
    """
    When we post to "/events/post"
    """
    {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
    """
    Then we get error 403

    @auth
    Scenario: Post cancelled event
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
            "destinations": [{"name":"events", "format": "json_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
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

        When we post to "/events/post"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "cancelled"}
        """
        Then we get OK response

        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {"state": "killed"}
        """
        When we get "publish_queue"
        Then we get list with 1 items
        Then we store "PUBLISHQUEUE" with first item

        When we transmit items
        Then versioned file exists "/tmp/123-#PUBLISHQUEUE.item_version#-1.txt"

    @auth
    Scenario: Patch state of ingested event (SDNTB-568 regression test)
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
            "destinations": [{"name":"events", "format": "json_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
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
            "state": "ingested",
            "subject": [{"qcode": "test qcaode", "name": "test name"}],
            "location": [{"qcode": "test qcaode", "name": "test name"}],
            "event_contact_info": ["#contacts._id#"]
        }
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {"state": "ingested"}
        """
        When we patch "/events/#events._id#"
        """
        {
            "state": "scheduled"
        }
        """
        Then we get updated response
        """
        {
            "guid": "123",
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
                "end": "2016-01-03T00:00:00+0000",
                "start": "2016-01-02T00:00:00+0000"
            },
            "state": "scheduled",
            "subject": [{"qcode": "test qcaode", "name": "test name"}],
            "location": [{"qcode": "test qcaode", "name": "test name"}],
            "event_contact_info": ["#contacts._id#"]
        }
        """

