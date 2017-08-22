Feature: Duplicate Planning

    @auth @notification
    Scenario: Duplicate a Planning item
        When we post to "planning" with success
        """
        [{
            "guid": "123",
            "headline": "test headline",
            "slugline": "test slugline",
            "state": "published",
            "pubstatus": "usable"
        }]
        """
        When we post to "coverage" with success
        """
        [
            {
                "guid": "456",
                "planning_item": "123",
                "planning": {
                    "ednote": "test coverage, 250 words",
                    "assigned_to": {
                        "desk": "Some Desk",
                        "user": "507f191e810c19729de860ea"
                    },
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "scheduled": "2029-11-21T14:00:00.000Z",
                    "g2_content_type": "text"
                }
            }
        ]
        """
        When we post to "/planning/123/duplicate"
        """
        [{}]
        """
        Then we get OK response
        When we get "/planning/123"
        Then we get existing resource
        """
        {
            "_id": "123",
            "guid": "123",
            "headline": "test headline",
            "slugline": "test slugline",
            "state": "published",
            "pubstatus": "usable",
            "coverages": [
                {
                    "guid": "456",
                    "planning_item": "123",
                    "planning": {
                        "ednote": "test coverage, 250 words",
                        "assigned_to": {
                            "desk": "Some Desk",
                            "user": "507f191e810c19729de860ea"
                        },
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "2029-11-21T14:00:00+0000",
                        "g2_content_type": "text"
                    }
                }
            ],
            "_coverages": [
                {
                    "coverage_id": "456",
                    "scheduled": "2029-11-21T14:00:00+0000",
                    "g2_content_type": "text"
                }
            ]
        }
        """
        When we get "/planning/#duplicate._id#"
        Then we get existing resource
        """
        {
            "_id": "#duplicate._id#",
            "guid": "#duplicate._id#",
            "headline": "test headline",
            "slugline": "test slugline",
            "state": "in_progress",
            "pubstatus": "__no_value__",
            "coverages": [
                {
                    "planning_item": "#duplicate._id#",
                    "planning": {
                        "ednote": "test coverage, 250 words",
                        "assigned_to": "__no_value__",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "scheduled": "__no_value__",
                        "g2_content_type": "text"
                    }
                }
            ],
            "_coverages": [
                {
                    "coverage_id": "__any_value__",
                    "scheduled": "__any_value__",
                    "g2_content_type": "text"
                }
            ]
        }
        """
        When we get "/planning_history"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "operation": "create",
                "planning_id": "123",
                "update": {
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "state": "published",
                    "pubstatus": "usable"
                }
            },
            {
                "operation": "coverage created",
                "planning_id": "123",
                "update": {"coverage_id": "456"}
            },
            {
                "operation": "duplicate",
                "planning_id": "123",
                "update": {"duplicate_id": "#duplicate._id#"}
            },
            {
                "operation": "duplicate_from",
                "planning_id": "#duplicate._id#",
                "update": {
                    "duplicate_id": "123",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "state": "in_progress"
                }
            }
        ]}
        """
        And we get notifications
        """
        [
            {
                "event": "planning:created",
                "extra": {"item": "123"}
            },
            {
                "event": "coverage:created",
                "extra": {"item": "456", "planning": "123"}
            },
            {
                "event": "planning:duplicated",
                "extra": {
                    "item": "#duplicate._id#",
                    "original": "123"
                }
            }
        ]
        """

    @auth
    Scenario: Planning can only be duplicated by user having privileges
        When we post to "planning" with success
        """
        [{
            "guid": "123",
            "headline": "test headline",
            "slugline": "test slugline",
            "state": "published",
            "pubstatus": "usable"
        }]
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 0, "users": 1}}
        """
        Then we get OK response
        When we post to "/planning/123/duplicate"
        """
        [{}]
        """
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 1}}
        """
        Then we get OK response
        When we post to "/planning/123/duplicate"
        """
        [{}]
        """
        Then we get OK response
