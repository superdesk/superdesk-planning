Feature: Planning

    @auth
    Scenario: Empty planning list
        Given empty "planning"
        When we get "/planning"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Create new planning item
        Given empty "users"
        Given empty "planning"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        Then we get existing resource
        """
        {"_id": "#users._id#", "invisible_stages": []}
        """
        When we post to "/planning" with success
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "item_class": "item class value",
                "headline": "test headline"
            }
        ]
        """
        When we get "/planning"
        Then we get list with 1 items

    @auth
    @notification
    Scenario: Plannings contain nested coverages
        Given "planning"
        """
        [{
            "_id": "123",
            "item_class": "item class value",
            "headline": "test headline"
        }]
        """
        Given "coverage"
        """
        [{
            "planning_item": "123",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "assigned_to": "whoever wants to do it"
            }
        }]
        """
        When we get "/planning"
        Then we get list with 1 items
        """
        {"_items": [{
            "_id": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "coverages": [{
                "planning_item": "123",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "assigned_to": "whoever wants to do it"
                }
            }]
        }]}
        """
