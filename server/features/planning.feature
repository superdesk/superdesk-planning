Feature: Planning

    @auth
    Scenario: Empty planning list
        Given empty "planning"
        When we get "/planning"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Create new planning item without agenda
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
        When we get "/coverage"
        Then we get a list with 1 items
        """
            {"_items": [{
                "planning_item": "#planning._id#"
            }
            ]}
        """
        When we get "/planning_history"
        Then we get a list with 2 items
        """
            {"_items": [{
                "planning_id":  "#planning._id#",
                "operation": "create",
                "update": {
                    "original_creator": "__any_value__",
                    "item_class": "item class value",
                    "headline": "test headline"
            }},
            {
                "planning_id":  "#planning._id#",
                "operation": "coverage created",
                 "update": {
                    "coverage_id": "__any_value__"
                }
            }]}
        """
        When we get "/coverage_history"
        Then we get a list with 1 items
        """
            {"_items": [{
                "operation": "create",
                "update": {
                    "planning_item": "#planning._id#"
                    }
            }
            ]}
        """

    @auth
    @notification
    Scenario: Create new planning item with agenda
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
        When we post to "agenda" with "agenda1" and success
        """
        [{"name": "foo1"}]
        """
        And we post to "agenda" with "agenda2" and success
        """
        [{"name": "foo2"}]
        """
        And we post to "/planning"
        """
        [
            {
                "unique_id": "123",
                "unique_name": "123 name",
                "item_class": "item class value",
                "headline": "test headline",
                "agendas": ["#agenda1#"]
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
                "headline": "test headline",
                "agendas": ["#agenda1#"]
            }]}
        """
        When we get "/planning_history"
        Then we get list with 2 items
        """
            {"_items": [
                {
                    "planning_id":  "#planning._id#",
                    "operation": "create",
                    "update": {
                        "original_creator": "__any_value__",
                        "item_class": "item class value",
                        "headline": "test headline",
                        "agendas": ["#agenda1#"]
                    }
                },
                {
                    "planning_id":  "#planning._id#",
                    "operation": "coverage created"
                }
            ]}
        """
        When we patch "/planning/#planning._id#"
        """
        { "agendas": ["#agenda1#", "#agenda2#"] }
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        { "agendas": [] }
        """
        Then we get OK response

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
            "item_class": "item class value",
            "headline": "test headline"
        }]
        """
        Given "coverage"
        """
        [{
            "planning_item": "#planning._id#",
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
            "_id": "#planning._id#",
            "item_class": "item class value",
            "headline": "test headline",
            "coverages": [{
                "planning_item": "#planning._id#",
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
        Then we get a list with 3 items
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
                "update": {"headline": "updated test headline"}},
                {"operation": "coverage created",
                "planning_id": "#planning._id#"}
            ]}
        """

    @auth
    Scenario: Creating planning related to an event is tracked in event history
        Given "events"
        """
        [
            {
                "unique_id": "123",
                "name": "Friday Club",
                "dates": {
                    "start": "2016-11-17T12:00:00.000Z",
                    "end": "2016-11-17T14:00:00.000Z",
                    "tz": "Europe/Berlin",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                },
                "occur_status": {
                    "name": "Planned, occurs certainly",
                    "qcode": "eocstat:eos5"
                }
            }
        ]
        """
        When we post to "/planning" with success
        """
        [
            {
                "unique_id": "123",
                "unique_name": "123 name",
                "item_class": "item class value",
                "headline": "test headline",
                "event_item": "#events._id#"
            }
        ]
        """
        Then we get OK response
        When we get "/planning_history"
        Then we get a list with 2 items
        """
            {"_items": [{
                "planning_id":  "#planning._id#",
                "operation": "create"},
                {"planning_id":  "#planning._id#",
                "operation": "coverage created"
                }
            ]}
        """
        When we get "/events_history"
        Then we get a list with 1 items
        """
            {"_items": [{
                "event_id": "#events._id#",
                "operation": "planning created",
                "update": {"planning_id": "#planning._id#"}}
            ]}
        """