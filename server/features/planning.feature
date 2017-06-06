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
        When we post to "/planning"
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
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:created",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
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
        When we get "/planning_history"
        Then we get list with 1 items
        """
            {"_items": [{
                "planning_id":  "#planning._id#",
                "operation": "create",
                "update": {
                    "original_creator": "__any_value__",
                    "item_class": "item class value",
                    "headline": "test headline"
            }
            }]}
        """

    @auth
    Scenario: Planning item can be created only by user having privileges
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 0, "users": 1}}
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "slugline": "test slugline",
            "headline": "test headline"
        }]
        """
        Then we get error 403
        When we setup test user
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 1, "users": 1}}
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "slugline": "test slugline",
            "headline": "test headline"
        }]
        """
        Then we get OK response

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
                "assigned_to": {
                    "user": "whoever wants to do it"
                }
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
                    "assigned_to": {
                        "user": "whoever wants to do it"
                    }
                }
            }]
        }]}
        """

    @auth
    @notification
    Scenario: Planning item can be modified only by user having privileges
        When we post to "planning"
        """
        [{"slugline": "slugger"}]
        """
        Then we get OK response
        Then we store "planningId" with value "#planning._id#" to context
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 0, "users": 1}}
        """
        Then we get OK response
        When we patch "/planning/#planningId#"
        """
        {"headline": "header"}
        """
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 1, "users": 1}}
        """
        Then we get OK response
        When we patch "/planning/#planningId#"
        """
        {"headline": "header"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {
                "item": "#planningId#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Planning history tracks updates
        Given empty "planning"
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
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"headline": "updated test headline"}
        """
        Then we get OK response
        When we get "/planning_history"
        Then we get a list with 2 items
        """
            {"_items": [{
                "planning_id":  "#planning._id#",
                "operation": "create",
                "update": {
                    "original_creator": "__any_value__",
                    "item_class": "item class value",
                    "headline": "test headline"}},
                {"planning_id":  "#planning._id#",
                "operation": "update",
                "update": {"headline": "updated test headline"}}
            ]}
        """

