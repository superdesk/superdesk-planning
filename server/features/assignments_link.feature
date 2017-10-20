Feature: Assignment link

    @auth
    Scenario: Sets the assignment_id of the content item
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
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """

    @auth
    Scenario: Assignment must exist
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "noidea",
            "item_id": "noidea"
        }]
        """
        Then we get error 400
        """
        {"_message": "Assignment not found."}
        """

    @auth
    Scenario: Content item must exist
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
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "noidea"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content item not found."}
        """

    @auth
    Scenario: Content item must not have an existing delivery record
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
                    "user": "507f191e810c19729de870eb"
                }
            }]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content is already linked to an assignment. Cannot link assignment and content."}
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "assignment_id": "#firstassignment#"
                    }
                },
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Sports Desk",
                        "user": "507f191e810c19729de870eb"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store assignment id in "secondassignment" from coverage 1
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#secondassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get error 400
        """
        {"_message": "Content is already linked to an assignment. Cannot link assignment and content."}
        """
