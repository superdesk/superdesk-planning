Feature: Event Embedded Planning
    @auth
    Scenario: Create and update associated Planning with an Event
        # Test creating and Event with a Planning item/Coveage
        When we post to "/events"
        """
        [{
            "guid": "event1",
            "name": "Event1",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "embedded_planning": [{
                "coverages": [{
                    "g2_content_type": "text",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2029-11-21T15:00:00.000Z"
                }]
            }]
        }]
        """
        Then we get OK response
        And we store "EVENT_ID" with value "#events._id#" to context
        When we get "/events"
        Then we get list with 1 items
        """
        {"_items": [{
            "guid": "event1",
            "type": "event",
            "original_creator": "#CONTEXT_USER_ID#",
            "firstcreated": "__now__",
            "versioncreated": "__now__"
        }]}
        """
        When we get "/events_planning_search?repo=planning&only_future=false&event_item=event1"
        Then we get list with 1 items
        """
        {"_items": [{
            "_id": "__any_value__",
            "original_creator": "#CONTEXT_USER_ID#",
            "firstcreated": "__now__",
            "versioncreated": "__now__",
            "event_item": "event1",
            "planning_date": "2029-11-21T12:00:00+0000",
            "coverages": [{
                "coverage_id": "__any_value__",
                "firstcreated": "__now__",
                "versioncreated": "__now__",
                "original_creator": "#CONTEXT_USER_ID#",
                "version_creator": "#CONTEXT_USER_ID#",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "g2_content_type": "text",
                    "scheduled": "2029-11-21T15:00:00+0000"
                }
            }]
        }]}
        """
        And we store "PLAN1" with first item
        And we store coverage id in "COVERAGE_ID" from plan 0 coverage 0
        When we get "/events/#EVENT_ID#"
        Then we get existing resource
        """
        {"planning_ids": ["#PLAN1._id#"]}
        """

        # Test updating an existing Planning item, and add new coverage
        When we patch "/events/#EVENT_ID#"
        """
        {"embedded_planning": [
            {
                "planning_id": "#PLAN1._id#",
                "coverages": [
                    {
                        "coverage_id": "#COVERAGE_ID#",
                        "g2_content_type": "text",
                        "news_coverage_status": "ncostat:int",
                        "language": "en",
                        "scheduled": "2029-11-21T15:00:00.000Z",
                        "internal_note": "note something here",
                        "slugline": "test"
                    },
                    {
                        "g2_content_type": "picture",
                        "news_coverage_status": "ncostat:onreq",
                        "language": "en",
                        "scheduled": "2029-11-21T16:00:00.000Z",
                        "internal_note": "only if enough demand",
                        "slugline": "test"
                    }
                ]
            }
        ]}
        """
        Then we get OK response
        When we get "/planning/#PLAN1._id#"
        Then we get existing resource
        """
        {"coverages": [{
            "coverage_id": "#COVERAGE_ID#",
            "news_coverage_status": {"qcode": "ncostat:int"},
            "planning": {
                "g2_content_type": "text",
                "scheduled": "2029-11-21T15:00:00+0000",
                "internal_note": "note something here",
                "slugline": "test"
            }
        }, {
            "coverage_id": "__any_value__",
            "news_coverage_status": {"qcode": "ncostat:onreq"},
            "planning": {
                "g2_content_type": "picture",
                "scheduled": "2029-11-21T16:00:00+0000",
                "internal_note": "only if enough demand"
            }
        }]}
        """

        # Test removing a coverage
        When we patch "/events/#EVENT_ID#"
        """
        {"embedded_planning": [
            {
                "planning_id": "#PLAN1._id#",
                "coverages": [
                    {
                        "g2_content_type": "picture",
                        "news_coverage_status": "ncostat:onreq",
                        "language": "en",
                        "scheduled": "2029-11-21T16:00:00.000Z",
                        "internal_note": "only if enough demand",
                        "slugline": "test"
                    }
                ]
            }
        ]}
        """
        Then we get OK response
        When we get "/planning/#PLAN1._id#"
        Then we get 1 coverages
        And we get existing resource
        """
        {"coverages": [{
            "coverage_id": "__any_value__",
            "news_coverage_status": {"qcode": "ncostat:onreq"},
            "planning": {
                "g2_content_type": "picture",
                "scheduled": "2029-11-21T16:00:00+0000",
                "internal_note": "only if enough demand"
            }
        }]}
        """
