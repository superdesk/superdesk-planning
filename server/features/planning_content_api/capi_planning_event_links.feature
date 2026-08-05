Feature: Events & Planning Content API
    Background: Setup publishing resources
        When we configure planning for publishing to capi
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        # Create an Event and link a Planning item to it
        When we post to "events"
        """
        [{
            "guid": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "dates": {
                "start": "2042-01-01T10:00:00+0000",
                "end": "2042-01-01T12:00:00+0000"
            }
        }]
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "guid": "plan1",
            "planning_date": "2042-01-01",
            "related_events": [{"_id": "event1", "link_type": "primary"}],
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                },
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
            }]
        }]
        """
        Then we get OK response
        When we set capi auth token to "#subscriber_token_0._id#"

    @auth
    Scenario: Can post to capi a Planning with a linked Event
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get capi "/events"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event1", "plans": ["plan1"]}
        ]}
        """
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {
            "_id": "plan1",
            "events": [{
                "uri": "urn:event:event1",
                "literal": "event1",
                "rel": "primary"
            }]
        }
        """

    @auth
    Scenario: Can post to capi a Planning with multiple linked Events
        Given config update
        """
        {"PLANNING_EVENT_LINK_METHOD": "one_primary_many_secondary"}
        """

        When we post to "/events/post"
        """
        {
            "event": "event1",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response

        When we post to "events"
        """
        [{
            "guid": "event2",
            "name": "Sports Event 2",
            "slugline": "sports-event-2",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "dates": {
                "start": "2042-01-01T12:00:00+0000",
                "end": "2042-01-01T14:00:00+0000"
            }
        }]
        """
        Then we get OK response
        When we patch "/planning/plan1"
        """
        {
            "related_events": [
                {"_id": "event1", "link_type": "secondary"},
                {"_id": "event2", "link_type": "secondary"}
            ]
        }
        """
        Then we get OK response

        # Post all items
        When we post to "/events/post"
        """
        {
            "event": "event2",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {
            "planning": "plan1",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response

        # Now get the items from the ContentAPI
        When we get capi "/events"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1", "plans": ["plan1"]},
            {"_id": "event2", "plans": ["plan1"]}
        ]}
        """
        When we get capi "/planning/plan1"
        Then we get existing resource
        """
        {
            "_id": "plan1",
            "events": [
                {
                    "uri": "urn:event:event1",
                    "literal": "event1",
                    "rel": "secondary"
                },
                {
                    "uri": "urn:event:event2",
                    "literal": "event2",
                    "rel": "secondary"
                }
            ]
        }
        """
