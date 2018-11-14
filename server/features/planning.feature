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
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline",
                "planning_date": "2016-01-02"
            }
        ]
        """
        Then we get OK response
        Then we store "planning_date" with value "#planning._planning_date#" to context
        And we get notifications
        """
        [{
            "event": "planning:created",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": [],
                "removed_agendas": [],
                "session": "__any_value__"
            }
        }]
        """
        When we get "/planning"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "type": "planning",
                "original_creator": "__any_value__",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline",
                "firstcreated": "__now__",
                "versioncreated": "__now__"
            }]}
        """
        When we get "/planning_history"
        Then we get a list with 1 items
        """
            {"_items": [{
                "planning_id":  "#planning._id#",
                "operation": "create",
                "update": {
                    "original_creator": "__any_value__",
                    "item_class": "item class value",
                    "headline": "test headline",
                    "slugline": "test slugline"
            }}]}
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "slugline": "test test test",
            "planning_date": "2016-01-02"
        }
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "original_creator": "__any_value__",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test test test"
            }]}
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
                "item_class": "item class value",
                "headline": "test headline",
                "agendas": ["#agenda1#"],
                "planning_date": "2016-01-02"
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
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": ["#agenda1#"],
                "removed_agendas": [],
                "session": "__any_value__"
            }
        }]
        """
        When we get "/planning"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "type": "planning",
                "original_creator": "__any_value__",
                "item_class": "item class value",
                "headline": "test headline",
                "agendas": ["#agenda1#"]
            }]}
        """
        When we get "/planning_history"
        Then we get list with 1 items
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
                }
            ]}
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "agendas": ["#agenda1#", "#agenda2#"],
            "planning_date": "2016-01-02"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": ["#agenda1#", "#agenda2#"],
                "removed_agendas": [],
                "session": "__any_value__"
            }
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "agendas": [],
            "planning_date": "2016-01-02"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": ["#agenda1#", "#agenda2#"],
                "removed_agendas": [],
                "session": "__any_value__"
            }
        },
        {
            "event": "planning:updated",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": [],
                "removed_agendas": ["#agenda1#", "#agenda2#"],
                "session": "__any_value__"
            }
        }
        ]
        """

    @auth
    @notification @test
    Scenario: Validate planning date of a planning item
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get error 400
        """
        {"_message": "Planning item should have a date"}
        """
