Feature: Assignment Complete

  @auth
  @notification
  Scenario: Assignment State changes to completed
    Given empty "assignments"
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline"
        }]
        """
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
                    "state": "in_progress"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
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
                "state": "in_progress"
            }
        }
        """
        When we perform complete on assignments "#firstassignment#"
        """
        { }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "assignments:completed",
            "extra": {
                "item": "#firstassignment#",
                "assigned_desk": "Politic Desk",
                "planning": "#planning._id#",
                "assignment_state": "completed"
            }
        }]
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
                "state": "completed"
            }
        }
        """

    @auth
    Scenario: Fail to complete when assignment not in progess state
    Given empty "assignments"
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
                    "state": "assigned"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
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
                "state": "assigned"
            }
        }
        """
        When we perform complete on assignments "#firstassignment#"
        """
        { }
        """
        Then we get error 400