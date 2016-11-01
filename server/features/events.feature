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
        When we get "/events?sort=[(%22dates.start%22,1)]&source={%22query%22:{%22range%22:{%22dates.start%22:{%22lte%22:%222015-01-01T00:00:00.000Z%22}}}}"
        Then we get list with 0 items
        When we get "/events?sort=[(%22dates.start%22,1)]&source={%22query%22:{%22range%22:{%22dates.start%22:{%22gte%22:%222016-01-02T00:00:00.000Z%22}}}}"
        Then we get list with 1 items
