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
        When we post to "/locations"
        """
        {
            "unique_name": "Test Location",
            "location_details": {
                "name": "Test Location",
                "related": {
                    "qcode": "test_qcode"
                    "name": "test_name"
                },
                "poi_details": {},
                
            }
        }
        """
        And we get "/locations/#locations._id#"
        Then we get existing resource
        """
        {
            "unique_name": "Test Location",
            "location_details": {
                "name": "Test Location",
                "related": {"test_qcode": "test_name"},
                "poi_details": {},
                
            }
        }
        """
