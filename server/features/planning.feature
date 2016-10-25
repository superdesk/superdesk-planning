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
        Given empty "locations"
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
                "planning_item": {
                    "item_meta": {"item_class": "item class value"},
                    "content_meta": {"qcode": "test qcaode", "name": "test name"},
                    "news_coverage_set": [
                        {
                            "planning": {
                                "assigned_to": "assigned to value",
                                "ed_note": "editors note",
                                "slugline": [{"qcode": "test qcaode", "name": "test name"}],
                                "subject": [{"qcode": "test qcaode", "name": "test name"}]
                            },  
                            "delivery": [
                                {
                                    "rel": "relationship id",
                                    "content_type": "photo"
                                }
                            ]
                        }
                    ]
                }
            }
        ]
        """
        When we get "/planning"
        Then we get list with 1 items
