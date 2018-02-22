Feature: Rewrite content
    Background: Initial setup
        Given the "validators"
        """
        [
        {
            "schema": {},
            "type": "text",
            "act": "publish",
            "_id": "publish_text"
        },
        {
            "_id": "publish_composite",
            "act": "publish",
            "type": "composite",
            "schema": {}
        }
        ]
        """
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60}]
        """
        And "vocabularies"
        """
        [{
            "_id": "newscoveragestatus",
            "display_name": "News Coverage Status",
            "type": "manageable",
            "unique_field": "qcode",
            "items": [
                {"is_active": true, "qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                {"is_active": true, "qcode": "ncostat:notdec", "name": "coverage not decided yet",
                    "label": "On merit"},
                {"is_active": true, "qcode": "ncostat:notint", "name": "coverage not intended",
                    "label": "Not planned"},
                {"is_active": true, "qcode": "ncostat:onreq", "name": "coverage upon request",
                    "label": "On request"}
            ]
        }]
        """
        And "archive"
        """
        [{
            "guid": "item1",
            "type": "text",
            "slugline": "test slugline",
            "headline": "test headline",
            "type": "text",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        And "planning"
        """
        [{"slugline": "test slugline"}]
        """
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            },
            "workflow_status": "active"
        }]}
        """
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """

    @auth
    Scenario: Rewrite content duplicates assignment and coverage
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we store assignment id in "secondassignment" from coverage 1
        Then we store coverage id in "secondcoverage" from coverage 1
        Then we get array of coverages by coverage_id
        """
        {
            "#firstcoverage#": {
                "planning": {
                    "g2_content_type": "text",
                    "slugline": "test slugline",
                    "ednote": "test coverage, I want 250 words",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "assigned_to": {
                    "user": "#CONTEXT_USER_ID#",
                    "desk": "#desks._id#",
                    "state": "in_progress"
                }
            },
            "#secondcoverage#": {
                "planning": {
                    "g2_content_type": "text",
                    "slugline": "test slugline",
                    "ednote": "__no_value__"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "assigned_to": {
                    "user": "#CONTEXT_USER_ID#",
                    "desk": "#desks._id#",
                    "state": "in_progress"
                }
            }
        }
        """
        Then assignment 1 is scheduled for end of today
        When we get "/assignments"
        Then we get list with 2 items
        """
        {"_items": [
            {
                "_id": "#firstassignment#",
                "assigned_to": {"state": "in_progress"}
            },
            {
                "_id": "#secondassignment#",
                "assigned_to": {"state": "in_progress"}
            }
        ]}
        """
        When we get "/archive"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#archive._id#", "assignment_id": "#firstassignment#"},
            {"_id": "#REWRITE_ID#", "assignment_id": "#secondassignment#"}
        ]}
        """

    @auth
    Scenario: Unlink a rewrite also unlinks the Assignment
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we store assignment id in "secondassignment" from coverage 1
        Then we store coverage id in "secondcoverage" from coverage 1
        When we delete link "archive/#REWRITE_ID#/rewrite"
        Then we get OK response
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "in_progress"}},
            "#secondassignment#": {"assigned_to": {"state": "assigned"}}
        }
        """
        When we get "/archive"
        Then we get array of _items by _id
        """
        {
            "#archive._id#": {"assignment_id": "#firstassignment#"},
            "#REWRITE_ID#": {"assignment_id": "__none__"}
        }
        """

    @auth
    Scenario: New assignment derives metadata from the news item
        When we patch "/archive/#archive._id#"
        """
        {
            "slugline": "newest slugline",
            "ednote": "newest ednote"
        }
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "slugline": "newest slugline",
            "ednote": "newest ednote"
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we store coverage id in "secondcoverage" from coverage 1
        Then we get array of coverages by coverage_id
        """
        {
            "#firstcoverage#": {
                "planning": {
                    "slugline": "test slugline",
                    "ednote": "test coverage, I want 250 words"
                }
            },
            "#secondcoverage#": {
                "planning": {
                    "slugline": "newest slugline",
                    "ednote": "__no_value__"
                }
            }
        }
        """
