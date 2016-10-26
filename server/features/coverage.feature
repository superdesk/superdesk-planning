Feature: Coverage 

    @auth
    Scenario: Empty coverage list
        Given empty "coverage"
        When we get "/coverage"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Create new coverage item
        Given empty "users"
        Given empty "coverage"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        Then we get existing resource
        """
        {"_id": "#users._id#", "invisible_stages": []}
        """
        When we post to "/coverage" with success
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "assigned_to": "whoever wants to do it"
                },
                "delivery": []
            }
        ]
        """
        When we get "/coverage"
        Then we get list with 1 items
