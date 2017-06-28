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
        Given empty "planning"
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "slugline": "planning 1",
            "agendas": ["#agenda._id#"]
        }]
        """
        Then we get OK response
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
                    "assigned_to": {
                        "user": "whoever wants to do it"
                    }
                },
                "planning_item": "#planning._id#",
                "delivery": []
            }
        ]
        """
        When we get "/coverage"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "original_creator": "__any_value__",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "assigned_to": {
                        "user": "whoever wants to do it"
                    }
                },
                "delivery": []
            }]}
        """
        When we get "/coverage_history"
        Then we get a list with 1 items
        """
            {"_items": [{"operation": "create", "coverage_id": "#coverage._id#", "update": {"unique_name": "123 name"}}]}
        """

    @auth
    @notification
    Scenario: Coverage assignment can be assigned either to a user or a desk. Not both.
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
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "slugline": "planning 1",
            "agendas": ["#agenda._id#"]
        }]
        """
        Then we get OK response
        When we post to "/coverage"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "planning_item": "#planning._id#",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "assigned_to": {
                        "user": "__any_value__"
                        "desk": "Politic desk"
                    }
                },
                "delivery": []
            }
        ]
        """
        Then we get error 400

    @auth
    @notification
    Scenario: Coverage assignment audit information is populated.
        Given empty "users"
        Given empty "coverage"
        Given empty "planning"
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "slugline": "planning 1",
            "agendas": ["#agenda._id#"]
        }]
        """
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
                    "assigned_to": {
                        "user": "whoever wants to do it"
                    }
                },
                "delivery": [],
                "planning_item": "#planning._id#"
            }
        ]
        """
        When we get "/coverage"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "original_creator": "__any_value__",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "assigned_to": {
                        "user": "whoever wants to do it",
                        "assigned_by": "#CONTEXT_USER_ID#",
                        "assigned_date": "__any_value__"
                    }
                },
                "delivery": []
            }]}
        """

    @auth
    @notification
    Scenario: Sends notification on coverage changes
        Given empty "users"
        Given empty "coverage"
        Given empty "planning"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        And we reset notifications
        Then we get existing resource
        """
        {"_id": "#users._id#", "invisible_stages": []}
        """
        When we post to "agenda" with "agenda1" and success
        """
        [{"name": "foo"}]
        """
        When we post to "planning"
        """
        [{
            "slugline": "planning 1",
            "agendas": ["#agenda1#"]
        }]
        """
        Then we get OK response
        Then we store "planningId" with value "#planning._id#" to context
        When we post to "/coverage"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "assigned_to": {
                        "user": "whoever wants to do it"
                    }
                },
                "delivery": [],
                "planning_item": "#planningId#"
            }
        ]
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "coverage:created",
            "extra": {
                "item": "#coverage._id#",
                "planning": "#planningId#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        And we patch "/coverage/#coverage._id#"
        """
        {
            "planning": {
                "ednote": "testing changes",
                "assigned_to": {
                    "user": "someone else"
                }
            }
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "coverage:updated",
            "extra": {
                "item": "#coverage._id#",
                "planning": "#planningId#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        And we delete "/coverage/#coverage._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "coverage:deleted",
            "extra": {
                "item": "#coverage._id#",
                "planning": "#planningId#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Coverage history tracks updates
        Given empty "coverage"
        Given empty "planning"
        When we post to "agenda" with "agenda1" and success
        """
        [{"name": "foo"}]
        """
        When we post to "planning"
        """
        [{
            "slugline": "planning 1",
            "agendas": ["#agenda1#"]
        }]
        """
        Then we get OK response
        Then we store "planningId" with value "#planning._id#" to context
        When we post to "/coverage" with success
        """
        [
             {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "assigned_to": {
                        "user": "whoever wants to do it"
                    }
                },
                "delivery": [],
                "planning_item": "#planning._id#"
            }
        ]
        """
        Then we get OK response
        When we patch "/coverage/#coverage._id#"
        """
        {"unique_name": "123 name updated"}
        """
        Then we get OK response
        When we get "/coverage_history"
        Then we get a list with 2 items
        """
            {"_items": [{
                "coverage_id":  "#coverage._id#",
                "operation": "create",
                "update": {
                    "planning": {"assigned_to": {"user": "whoever wants to do it" }}
                    }},
                {"coverage_id":  "#coverage._id#",
                "operation": "update",
                "update": {"unique_name": "123 name updated"}}
            ]}
        """
        When we get "/coverage_history?where=coverage_id==%22#coverage._id#%22"
        Then we get list with 2 items
        """
            {"_items": [{
                "coverage_id":  "#coverage._id#",
                "operation": "create"
                },
                {"coverage_id":  "#coverage._id#",
                "operation": "update"
                }
            ]}
        """
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 3 items
        """
            {"_items": [
                {"operation": "create"},
                {"operation": "coverage created",
                    "update": {"coverage_id": "#coverage._id#"}},
                {"operation": "coverage updated",
                    "update": {"coverage_id": "#coverage._id#"}}
            ]}
        """
        When we delete "/coverage/#coverage._id#"
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 4 items
        """
            {"_items": [
                {"operation": "create"},
                {"operation": "coverage created",
                    "update": {"coverage_id": "#coverage._id#"}},
                {"operation": "coverage updated",
                    "update": {"coverage_id": "#coverage._id#"}},
                {"operation": "coverage deleted",
                    "update": {"coverage_id": "#coverage._id#"}}
            ]}
        """
