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
                "unique_id": "123",
                "unique_name": "123 name",
                "item_class": "item class value",
                "headline": "test headline"
            }
        ]
        """
        When we get "/planning"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "original_creator": "__any_value__",
                "item_class": "item class value",
                "headline": "test headline"
            }]}
        """

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

    @auth
    @notification
    Scenario: Update agendas when a planning is removed
        # Given "planning"
        When we post to "planning"
        """
        [{
            "slugline": "planning 1"
        }]
        """
        Then we store "planningId" with value "#planning._id#" to context
        When we post to "planning" with success
        """
        [{
            "planning_type": "agenda",
            "planning_items": ["#planningId#"]
        }]
        """
        And we delete "/planning/#planningId#"
        Then we get response code 204
        When we get "/planning"
        Then we get field planning_items exactly
        """
        []
        """
