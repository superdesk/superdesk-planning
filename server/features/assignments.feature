Feature: Assignments

    @auth
    Scenario: Empty planning list
        Given empty "assignments"
        When we get "/assignments"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Assignments are created via coverages
        Given empty "assignments"
        When we post to "assignments"
        """
        [
          {
            "assigned_to": {
              "user": "1234",
              "desk": "1234"
            }
          }
        ]
        """
        Then we get error 405
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
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "coverage_provider": {
                            "qcode": "stringer",
                            "name": "Stringer"}
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/planning/#planning._id#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "assignment_id": "#firstassignment#",
                        "coverage_provider": {"name": "Stringer"}
                    }
                }
            ]
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "507f191e810c19729de870eb",
                "coverage_provider": {"name": "Stringer"}
            }
        }
        """
        And we get notifications
        """
        [{
            "event": "assignments:created",
            "extra": {"item": "#firstassignment#"}
        },
        {
            "event": "planning:updated",
            "extra": {"item": "#planning._id#"}
        }]
        """
        When we reset notifications
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "507f191e810c19729de870eb",
                "coverage_provider": {"qcode":"agencies", "name": "Agencies"}
            }
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "assignments:updated",
            "extra": {"item": "#firstassignment#"}
        }]
        """
        When we reset notifications
        When we patch "/assignments/#firstassignment#"
        """
        {
            "assigned_to": {
                "desk": "Sports Desk",
                "user": "507f191e810c19729de87034",
                "coverage_provider": {"qcode": "agencies", "name": "Agencies"}
            }
        }
        """
        Then we get OK response
        And we get notifications
        """
        [
            {
                "event": "assignments:updated",
                "extra": {"item": "#firstassignment#"}
            },
            {
                "event": "activity",
                "extra": {
                    "activity": {
                        "message": "{{assignor}} assigned a coverage to {{assignee}}"
                    }
                }
            }
        ]
        """

    @auth
    Scenario: Activity notification is only sent if the assignment created is not completed
        Given empty "activity"
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "Politic Desk",
                    "user": "507f191e810c19729de870eb",
                    "state": "completed"
                }
            }]
        }
        """
        Then we get OK response
        When we get "activity"
        Then we get list with 0 items
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "Politic Desk",
                    "user": "507f191e810c19729de870eb"
                }
            }]
        }
        """
        Then we get OK response
        When we get "activity"
        Then we get list with 1 items
        """
        {"_items": [{
            "resource": "assignments",
            "message": "{{assignor}} assigned a coverage to {{assignee}}",
            "data": {
                "assignee": "you",
                "assignor": "test_user"
            }
        }]}
        """
