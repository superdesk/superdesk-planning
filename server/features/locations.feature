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
                "location_details": {
                    "name": "Test Location",
                    "poi_details": {}
                }
            }
        ]
        """
        When we get "/locations"
        Then we get list with 1 items
