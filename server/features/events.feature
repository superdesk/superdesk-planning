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
                "description": {
                    "definition_short": "short value",
                    "definition_long": "long value",
                    "note": "note value"
                },
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
    Scenario: Generate dates from recurring rules
        When we post to "/events" with success
        """
        [
            {
                "unique_id": "123",
                "unique_name": "JO",
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-18",
                    "recurring_rule": {
                        "frequency": "YEARLY",
                        "interval": 4,
                        "count": 4
                    }
                }
            }
        ]
        """
        Then we get existing resource
        """
        {"_items": [
            {
                "unique_name": "JO",
                "dates": {"start": "2016-01-02T00:00:00+0000", "end": "2016-01-18T00:00:00+0000"}
            },
            {
                "unique_name": "JO",
                "dates": {"start": "2020-01-02T00:00:00+0000", "end": "2020-01-18T00:00:00+0000"}
            },
            {
                "unique_name": "JO",
                "dates": {"start": "2024-01-02T00:00:00+0000", "end": "2024-01-18T00:00:00+0000"}
                },
            {
                "unique_name": "JO",
                "dates": {"start": "2028-01-02T00:00:00+0000", "end": "2028-01-18T00:00:00+0000"}
            }
        ]}
        """
        When we get "/events?source={"query": {"term": {"unique_name": "JO"}}}"
        Then we get list with 4 items
