Feature: Locations

    @auth
    Scenario: Empty locations list
        Given empty "locations"
        When we get "/locations"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Create new location
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
        When we post to "/locations" with success
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "Test Location",
                "address": {
                    "line": [
                        "street 123",
                        "apt 1"
                    ],
                    "locality": "some locality",
                    "area": "some area",
                    "country": "some country",
                    "postal_code": "some postal code"
                }
            }
        ]
        """
        When we get "/locations"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "original_creator": "__any_value__",
                "name": "Test Location",
                "address": {
                    "line": [
                        "street 123",
                        "apt 1"
                    ],
                    "locality": "some locality",
                    "area": "some area",
                    "country": "some country",
                    "postal_code": "some postal code"
                }
            }]}
        """

    @auth
    @notification
    Scenario: Delete orphan location
        When we post to "/locations" with success
        """
        [
        {
            "_id" : "5c8199038e64b96205b8d30a",
            "address" : {
                "locality" : "Tasmania",
                "external" : {
                    "nominatim" : {
                        "address" : {
                            "locality" : "Glenorchy",
                            "postcode" : "",
                            "state" : "Tasmania",
                            "road" : "Eady Street",
                            "country" : "Australia"
                        }
                    }
                },
                "postal_code" : "",
                "country" : "Australia",
                "line" : [
                    "Eady Street"
                ],
                "area" : "Glenorchy"
            },
            "type" : "Unclassified",
            "guid" : "urn:newsml:localhost:2019-03-08T09:19:47.499390:37b70f08-15ae-4c4e-be7b-35fb8c03af7b",
            "name" : " Ian James Memorial Ground.",
            "unique_name" : " Ian James Memorial Ground. Eady Street, Glenorchy, Tasmania, Australia"
        }
        ]
        """
        When we delete "locations/5c8199038e64b96205b8d30a"
        Then we get response code 204

    @auth
    @notification
    Scenario: Delete linked location
        Given "events"
        """
        [
        {
            "_id" : "urn:newsml:localhost:2019-04-11T12:41:35.703264:81b74f31-43bb-46f2-906e-3ea0471b0639",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "type" : "event",
            "guid" : "urn:newsml:localhost:2019-04-11T12:41:35.703264:81b74f31-43bb-46f2-906e-3ea0471b0639",
            "state" : "draft",
            "name" : "Easter hat parade",
            "location" : [
                {
                    "name" : "Ian James Memorial Ground.",
                    "qcode" : "123"
                }
            ]
        }
        ]
        """
        Given "locations"
        """
        [
        {
            "_id" : "5c8199038e64b96205b8d30a",
            "address" : {
                "locality" : "Tasmania",
                "external" : {
                    "nominatim" : {
                        "address" : {
                            "locality" : "Glenorchy",
                            "postcode" : "",
                            "state" : "Tasmania",
                            "road" : "Eady Street",
                            "country" : "Australia"
                        }
                    }
                },
                "postal_code" : "",
                "country" : "Australia",
                "line" : [
                    "Eady Street"
                ],
                "area" : "Glenorchy"
            },
            "type" : "Unclassified",
            "name" : "Ian James Memorial Ground.",
            "unique_name" : " Ian James Memorial Ground. Eady Street, Glenorchy, Tasmania, Australia"
        }
        ]
        """
        When we patch "/locations/5c8199038e64b96205b8d30a"
        """
        {
            "guid" : "123"
        }
        """
        Then we get OK response
        When we delete "locations/5c8199038e64b96205b8d30a"
        Then we get response code 204
        When we get "/locations"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "5c8199038e64b96205b8d30a", "is_active": false}
        ]}
        """
