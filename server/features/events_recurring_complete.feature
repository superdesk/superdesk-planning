Feature: Recurring Events - Mark as Completed
    @auth
    Scenario: Can mark a recurring series as completed
        When we post to "events"
        """
        [{
            "name": "Daily Event",
            "dates": {
                "start": "#DATE-3#",
                "end": "#DATE-2#",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we post to "planning/#EVENT3._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#EVENT3._id#"
        """
        {
            "completed": true,
            "actioned_date": "#EVENT3.dates.start#",
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "completed": true, "actioned_date": "#EVENT3.dates.start#"},
            {"_id": "#EVENT2._id#", "completed": true, "actioned_date": "#EVENT3.dates.start#"},
            {"_id": "#EVENT3._id#", "completed": true, "actioned_date": "#EVENT3.dates.start#"},
            {"_id": "#EVENT4._id#", "completed": true, "actioned_date": "#EVENT3.dates.start#"}
        ]}
        """
        When we get "/planning_history"
        Then we get list with 8 items
        """
        {"_items": [
            {"operation": "create", "item_id": "#EVENT1._id#", "item_type": "event"},
            {"operation": "create", "item_id": "#EVENT2._id#", "item_type": "event"},
            {"operation": "create", "item_id": "#EVENT3._id#", "item_type": "event"},
            {"operation": "create", "item_id": "#EVENT4._id#", "item_type": "event"},
            {
                "operation": "edited", "item_id": "#EVENT1._id#", "item_type": "event",
                "update": {"completed": true, "actioned_date": "#EVENT3.dates.start#"}
            },
            {
                "operation": "edited", "item_id": "#EVENT2._id#", "item_type": "event",
                "update": {"completed": true, "actioned_date": "#EVENT3.dates.start#"}
            },
            {
                "operation": "edited", "item_id": "#EVENT3._id#", "item_type": "event",
                "update": {"completed": true, "actioned_date": "#EVENT3.dates.start#"}
            },
            {
                "operation": "edited", "item_id": "#EVENT4._id#", "item_type": "event",
                "update": {"completed": true, "actioned_date": "#EVENT3.dates.start#"}
            }
        ]}
        """

    @auth
    Scenario: Marking recurring events as completed cancels associated planning items
        When we post to "events"
        """
        [{
            "name": "Daily Event",
            "dates": {
                "start": "#DATE-3#",
                "end": "#DATE-2#",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we post to "planning"
        """
        [{
            "slugline": "Test Plan 1",
            "planning_date": "#EVENT1.dates.end#",
            "coverages": [{
                "coverage_id": "coverage_1",
                "workflow_status": "draft",
                "planning": {
                    "g2_content_type": "text",
                    "scheduled": "#EVENT1.dates.end#"
                },
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
            }],
            "related_events": [{"_id": "#EVENT1._id#", "link_type": "primary"}]
        }, {
            "slugline": "Test Plan 2",
            "planning_date": "#EVENT2.dates.end#",
            "coverages": [{
                "coverage_id": "coverage_2",
                "workflow_status": "draft",
                "planning": {
                    "g2_content_type": "text",
                    "scheduled": "#EVENT2.dates.end#"
                },
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
            }],
            "related_events": [{"_id": "#EVENT2._id#", "link_type": "primary"}]
        }, {
            "slugline": "Test Plan 3",
            "planning_date": "#EVENT3.dates.end#",
            "coverages": [{
                "coverage_id": "coverage_3",
                "workflow_status": "draft",
                "planning": {
                    "g2_content_type": "text",
                    "scheduled": "#EVENT3.dates.end#"
                },
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
            }],
            "related_events": [{"_id": "#EVENT3._id#", "link_type": "primary"}]
        }, {
            "slugline": "Test Plan 4",
            "planning_date": "#EVENT4.dates.end#",
            "coverages": [{
                "coverage_id": "coverage_4",
                "workflow_status": "draft",
                "planning": {
                    "g2_content_type": "text",
                    "scheduled": "#EVENT4.dates.end#"
                },
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
            }],
            "related_events": [{"_id": "#EVENT4._id#", "link_type": "primary"}]
        }]
        """
        Then we get OK response
        Then we store "PLAN1" with first item
        Then we store "PLAN2" with 2 item
        Then we store "PLAN3" with 3 item
        Then we store "PLAN4" with 4 item
        When we post to "planning/#EVENT3._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#EVENT3._id#"
        """
        {
            "completed": true,
            "actioned_date": "#EVENT3.dates.start#",
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "completed": true, "actioned_date": "#EVENT3.dates.start#"},
            {"_id": "#EVENT2._id#", "completed": true, "actioned_date": "#EVENT3.dates.start#"},
            {"_id": "#EVENT3._id#", "completed": true, "actioned_date": "#EVENT3.dates.start#"},
            {"_id": "#EVENT4._id#", "completed": true, "actioned_date": "#EVENT3.dates.start#"}
        ]}
        """
        When we get "/planning"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#PLAN1._id#", "coverages": [{"coverage_id": "coverage_1", "workflow_status": "draft"}]},
            {"_id": "#PLAN2._id#", "coverages": [{"coverage_id": "coverage_2", "workflow_status": "draft"}]},
            {"_id": "#PLAN3._id#", "coverages": [{"coverage_id": "coverage_3", "workflow_status": "cancelled"}]},
            {"_id": "#PLAN4._id#", "coverages": [{"coverage_id": "coverage_4", "workflow_status": "cancelled"}]}
        ]}
        """

    @auth
    Scenario: Cannot mark a recurring series as completed that hasn't started yet
        When we post to "events"
        """
        [{
            "name": "Daily Event",
            "dates": {
                "start": "#DATE+1#",
                "end": "#DATE+2#",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        When we post to "planning/#EVENT1._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#EVENT1._id#"
        """
        {
            "completed": true,
            "actioned_date": "#EVENT1.dates.start#",
            "update_method": "all"
        }
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"validator exception": "400: Recurring series has not started."}
        }
        """

    @auth
    Scenario: Marking a recurring series as completed fails if invalid actioned_date provided
        When we post to "events"
        """
        [{
            "name": "Daily Event",
            "dates": {
                "start": "#DATE-3#",
                "end": "#DATE-2#",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we post to "planning/#EVENT3._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#EVENT3._id#"
        """
        {
            "completed": true,
            "actioned_date": "foo_bar_123",
            "update_method": "all"
        }
        """
        Then we get error 400
        When we patch "/events/#EVENT3._id#"
        """
        {
            "completed": true,
            "actioned_date": "#EVENT3.dates.start#",
            "update_method": "all"
        }
        """
        Then we get OK response

    @auth
    Scenario: Completion date must be within the range of the recurring series
        When we post to "events"
        """
        [{
            "name": "Daily Event",
            "dates": {
                "start": "#DATE-3#",
                "end": "#DATE-2#",
                "tz": "Australia/Sydney",
                "recurring_rule": {"frequency": "DAILY", "interval": 1, "count": 4, "endRepeatMode": "count"}
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        When we post to "planning/#EVENT1._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#EVENT1._id#"
        """
        {"completed": true, "actioned_date": "#DATE-5#"}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"validator exception": "400: Completed date is before Recurring series start date."}
        }
        """
        When we patch "/events/#EVENT1._id#"
        """
        {"completed": true, "actioned_date": "#DATE+5#"}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"validator exception": "400: Completed date is after Recurring series end date."}
        }
        """
        When we patch "/events/#EVENT1._id#"
        """
        {"completed": true, "actioned_date": "#DATE-1#"}
        """
        Then we get OK response

    @auth
    Scenario: Mark completed fails if recurring series has already completed
        When we post to "events"
        """
        [{
            "name": "Daily Event",
            "dates": {
                "start": "#DATE-9#",
                "end": "#DATE-8#",
                "tz": "Australia/Sydney",
                "recurring_rule": {"frequency": "DAILY", "interval": 1, "count": 4, "endRepeatMode": "count"}
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        When we post to "planning/#EVENT1._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#EVENT1._id#"
        """
        {"completed": true}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"validator exception": "400: Recurring series has already finished."}
        }
        """

    @auth
    Scenario: Mark completed fails if recurring series hasn't started yet
        When we post to "events"
        """
        [{
            "name": "Daily Event",
            "dates": {
                "start": "#DATE+2#",
                "end": "#DATE+3#",
                "tz": "Australia/Sydney",
                "recurring_rule": {"frequency": "DAILY", "interval": 1, "count": 4, "endRepeatMode": "count"}
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        When we post to "planning/#EVENT1._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#EVENT1._id#"
        """
        {"completed": true}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"validator exception": "400: Recurring series has not started."}
        }
        """
