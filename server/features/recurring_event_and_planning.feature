Feature: Recurring Events & Planning
    Background: Initial setup
        When we post to "/events"
        """
        [{
            "name": "Daily Club",
            "dates": {
                "start": "2024-11-21T12:00:00.000Z",
                "end": "2024-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2024-11-21T12:00:00+0000", "end": "2024-11-21T14:00:00+0000"}
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2024-11-22T12:00:00+0000", "end": "2024-11-22T14:00:00+0000"}
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2024-11-23T12:00:00+0000", "end": "2024-11-23T14:00:00+0000"}
        }]}
        """

    @auth
    Scenario: Creates single plan for event series by default
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "event_item": "#EVENT1._id#",
            "planning_date": "2024-11-21T12:00:00.000Z",
            "coverages": [{
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type": "text",
                    "scheduled": "2024-11-21T15:00:00.000Z"
                }
            }, {
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type": "picture",
                    "scheduled": "2024-11-21T16:00:00.000Z"
                }
            }]
        }]
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 1 items
        """
        {"_items": [{
            "guid": "__any_value__",
            "type": "planning",
            "headline": "test headline",
            "planning_date": "2024-11-21T12:00:00+0000",
            "event_item": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-21T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-21T16:00:00+0000"}}
            ]
        }]}
        """

    @auth
    Scenario: Create planning for future events
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "event_item": "#EVENT2._id#",
            "planning_date": "2024-11-22T12:00:00.000Z",
            "update_method": "future",
            "coverages": [{
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type": "text",
                    "scheduled": "2024-11-22T15:00:00.000Z"
                }
            }, {
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type": "picture",
                    "scheduled": "2024-11-22T16:00:00.000Z"
                }
            }]
        }]
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 2 items
        """
        {"_items": [{
            "guid": "__any_value__",
            "type": "planning",
            "headline": "test headline",
            "planning_date": "2024-11-22T12:00:00+0000",
            "event_item": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-22T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-22T16:00:00+0000"}}
            ]
        }, {
            "guid": "__any_value__",
            "type": "planning",
            "headline": "test headline",
            "planning_date": "2024-11-23T12:00:00+0000",
            "event_item": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-23T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-23T16:00:00+0000"}}
            ]
        }]}
        """

    @auth
    Scenario: Create planning for each event in the series
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "event_item": "#EVENT1._id#",
            "planning_date": "2024-11-21T12:00:00.000Z",
            "update_method": "all",
            "coverages": [{
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type": "text",
                    "scheduled": "2024-11-21T15:00:00.000Z"
                }
            }, {
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type": "picture",
                    "scheduled": "2024-11-21T16:00:00.000Z"
                }
            }]
        }]
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 3 items
        """
        {"_items": [{
            "guid": "__any_value__",
            "type": "planning",
            "headline": "test headline",
            "planning_date": "2024-11-21T12:00:00+0000",
            "event_item": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-21T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-21T16:00:00+0000"}}
            ]
        }, {
            "guid": "__any_value__",
            "type": "planning",
            "headline": "test headline",
            "planning_date": "2024-11-22T12:00:00+0000",
            "event_item": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-22T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-22T16:00:00+0000"}}
            ]
        }, {
            "guid": "__any_value__",
            "type": "planning",
            "headline": "test headline",
            "planning_date": "2024-11-23T12:00:00+0000",
            "event_item": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-23T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-23T16:00:00+0000"}}
            ]
        }]}
        """

    @auth
    Scenario: Create planning for future events through events endpoint
        When we patch "/events/#EVENT2._id#"
        """
        {
            "embedded_planning": [{
                "update_method": "future",
                "coverages": [{
                    "g2_content_type": "text",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2024-11-22T15:00:00.000Z",
                    "slugline": "test slugline",
                    "headline": "test headline"
                }, {
                    "g2_content_type": "picture",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2024-11-22T16:00:00.000Z",
                    "slugline": "test slugline",
                    "headline": "test headline"
                }]
            }]
        }
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 2 items
        """
        {"_items": [{
            "guid": "__any_value__",
            "type": "planning",
            "planning_date": "2024-11-22T12:00:00+0000",
            "event_item": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-22T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-22T16:00:00+0000"}}
            ]
        }, {
            "guid": "__any_value__",
            "type": "planning",
            "planning_date": "2024-11-23T12:00:00+0000",
            "event_item": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-23T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-23T16:00:00+0000"}}
            ]
        }]}
        """

    @auth
    Scenario: Create planning for each event in the series through events endpoint
        When we patch "/events/#EVENT2._id#"
        """
        {
            "embedded_planning": [{
                "update_method": "all",
                "coverages": [{
                    "g2_content_type": "text",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2024-11-22T15:00:00.000Z",
                    "slugline": "test slugline",
                    "headline": "test headline"
                }, {
                    "g2_content_type": "picture",
                    "news_coverage_status": "ncostat:int",
                    "scheduled": "2024-11-22T16:00:00.000Z",
                    "slugline": "test slugline",
                    "headline": "test headline"
                }]
            }]
        }
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 3 items
        """
        {"_items": [{
            "guid": "__any_value__",
            "type": "planning",
            "planning_date": "2024-11-21T12:00:00+0000",
            "event_item": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-21T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-21T16:00:00+0000"}}
            ]
        }, {
            "guid": "__any_value__",
            "type": "planning",
            "planning_date": "2024-11-22T12:00:00+0000",
            "event_item": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-22T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-22T16:00:00+0000"}}
            ]
        }, {
            "guid": "__any_value__",
            "type": "planning",
            "planning_date": "2024-11-23T12:00:00+0000",
            "event_item": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "coverages": [
                {"planning": {"g2_content_type": "text", "scheduled": "2024-11-23T15:00:00+0000"}},
                {"planning": {"g2_content_type": "picture", "scheduled": "2024-11-23T16:00:00+0000"}}
            ]
        }]}
        """
