Feature: Events with Coverages
    Background: Setup data
        When we configure planning for publishing
        Given "desks"
        """
        [
            {"name": "Politic Desk", "members": [{"user": "#CONTEXT_USER_ID#"}]},
            {"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}
        ]
        """
        And we have sessions "/sessions"

        @auth
        Scenario: Create an Event with Coverages
            When we post to "/events"
            """
            [{
                "name": "Event being covered",
                "dates": {
                    "start": "2049-11-21T12:00:00+0000",
                    "end": "2049-11-21T13:00:00+0000"
                },
                "coverages": [{
                    "workflow_status": "active",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "planning": {
                        "g2_content_type": "text",
                        "scheduled": "2049-11-21T13:00:00+0000",
                        "slugline": "test-event-covered",
                        "headline": "Testing of an Event being covered"
                    },
                    "assigned_to": {
                        "desk": "#desks_0._id#",
                        "user": "#CONTEXT_USER_ID#"
                    }
                }]
            }]
            """
            Then we get OK response
            Then we store coverage id in "coverage_id" from coverage 0
            And we store assignment id in "assignment_id" from coverage 0
            When we get "/events/#events._id#"
            Then we get existing resource
            """
            {
                "coverages": [{
                    "coverage_id": "#coverage_id#",
                    "assigned_to": {"assignment_id": "#assignment_id#"}
                }]
            }
            """
            When we get "/assignments/#assignment_id#"
            Then we get existing resource
            """
            {
                "assigned_to": {
                    "desk": "#desks_0._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "assigned"
                }
            }
            """
            When we post to "/events/post"
            """
            {
                "event": "#events._id#",
                "etag": "#events._etag#",
                "pubstatus": "usable"
            }
            """
            Then we get OK response
            When we get "/assignments/"
            Then we get list with 1 items
            When we post to "/events/post"
            """
            {
                "event": "#events._id#",
                "etag": "#events._etag#",
                "pubstatus": "cancelled"
            }
            """
            Then we get OK response
            When we get "/assignments/"
            Then we get list with 0 items
