Feature: Events

    @auth
    Scenario: Empty events list
        Given empty "events"
        When we get "/events"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Create new events item
        Given empty "users"
        Given empty "locations"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        Then we get existing resource
        """
        {"_id": "#users._id#", "invisible_stages": []}
        """
        When we post to "/events" with success
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
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
                "contact_info": [{"qcode": "test qcaode", "name": "test name"}]
            }
        ]
        """
        When we get "/events"
        Then we get list with 1 items
        When we get "/events?sort=[("dates.start",1)]&source={"query":{"range":{"dates.start":{"lte":"2015-01-01T00:00:00.000Z"}}}}"
        Then we get list with 0 items
        When we get "/events?sort=[("dates.start",1)]&source={"query":{"range":{"dates.start":{"gte":"2016-01-02T00:00:00.000Z"}}}}"
        Then we get list with 1 items

    @auth
    @notification
    Scenario: Generate events from recurring rules
        When we post to "/events" with success
        """
        [
            {
                "unique_id": "123",
                "name": "Friday Club",
                "dates": {
                    "start": "2016-11-17T23:00:00.000Z",
                    "end": "2016-11-18T00:00:00.000Z",
                    "tz": "Europe/Berlin",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "byday": "FR",
                        "count": 3
                    }
                }
            }
        ]
        """
        Then we get a list with 3 items
        """
        {"_items": [
            {
                "name": "Friday Club",
                "dates": {"start": "2016-11-17T23:00:00+0000", "end": "2016-11-18T00:00:00+0000"}
            },
            {
                "name": "Friday Club",
                "dates": {"start": "2016-11-24T23:00:00+0000", "end": "2016-11-25T00:00:00+0000"}
            },
            {
                "name": "Friday Club",
                "dates": {"start": "2016-12-01T23:00:00+0000", "end": "2016-12-02T00:00:00+0000"}
            }
        ]}
        """
        When we get "/events?where={"recurrence_id": "#events.recurrence_id#"}"
        Then we get list with 3 items

    @auth
    @notification
    Scenario: Prevent to save an event with an existing unique_name
    When we post to "/events" with success
    """
    [
        {
            "unique_name": "JO",
            "name": "JO",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-18"
            }
        }
    ]
    """
    And we post to "/events"
    """
    [
        {
            "unique_name": "JO",
            "name": "JO 2022",
            "dates": {
                "start": "2016-01-10",
                "end": "2016-01-18"
            }
        }
    ]
    """
    Then we get error 400
