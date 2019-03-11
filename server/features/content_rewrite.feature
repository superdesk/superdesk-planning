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
        [{"slugline": "test slugline", "planning_date": "2016-01-02"}]
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
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
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
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "in_progress"}}
        }
        """

    @auth
    @vocabularies
    Scenario: Unlink a rewrite also unlinks the Assignment
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
          }]
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [
            {
                "coverage_id": "#firstcoverage#",
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00.000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "assignment_id": "#firstassignment#"
                },
                "workflow_status": "active"
            },
            {
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage 2, I want 350 words",
                    "slugline": "test slugline 2",
                    "scheduled": "2029-10-12T14:00:00.000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "assigned"
                },
                "workflow_status": "active"
            }
        ]}
        """
        Then we get OK response
        Then we store assignment id in "secondassignment" from coverage 1
        Then we store coverage id in "secondcoverage" from coverage 1
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "in_progress"}},
            "#secondassignment#": {"assigned_to": {"state": "assigned"}}
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#secondassignment#",
            "item_id": "#REWRITE_ID#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "in_progress"}},
            "#secondassignment#": {"assigned_to": {"state": "in_progress"}}
        }
        """
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
