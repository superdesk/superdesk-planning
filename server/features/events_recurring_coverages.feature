Feature: Events Recurring Coverages
    Background: Setup data
        Given "desks"
        """
        [{"name": "Politic Desk", "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """

    @auth
    Scenario: Create a recurring event with a coverage
        When we post to "/events"
        """
        [{
            "name": "Daily Briefing",
            "dates": {
                "start": "2099-11-21T12:00:00+0000",
                "end": "2099-11-21T13:00:00+0000",
                "tz": "Europe/Brussels",
                "recurring_rule": {"frequency": "DAILY", "interval": 1, "count": 3, "endRepeatMode": "count"}
            },
            "coverages": [{
                "coverage_id": "tempId-text",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {"g2_content_type": "text", "scheduled": "2099-11-21T14:00:00+0000"}
            }]
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        When we get "/events?sort=[("dates.start",1)]"
        Then we store coverage id in "COVERAGE1" from plan 0 coverage 0
        And we get list with 3 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "coverages": [{
                    "coverage_id": "#COVERAGE1#",
                    "original_coverage_id": "#COVERAGE1#",
                    "planning": {"scheduled": "2099-11-21T14:00:00+0000"}
                }]
            },
            {
                "_id": "#EVENT2._id#",
                "coverages": [{
                    "original_coverage_id": "#COVERAGE1#",
                    "planning": {"scheduled": "2099-11-22T14:00:00+0000"}
                }]
            },
            {
                "_id": "#EVENT3._id#",
                "coverages": [{
                    "original_coverage_id": "#COVERAGE1#",
                    "planning": {"scheduled": "2099-11-23T14:00:00+0000"}
                }]
            }
        ]}
        """

    @auth
    Scenario: Convert an event with a coverage to a recurring event
        When we post to "/events"
        """
        [{
            "name": "Daily Briefing",
            "dates": {
                "start": "2099-11-21T12:00:00+0000",
                "end": "2099-11-21T13:00:00+0000",
                "tz": "Europe/Brussels"
            },
            "coverages": [{
                "coverage_id": "tempId-text",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {"g2_content_type": "text", "scheduled": "2099-11-21T14:00:00+0000"}
            }]
        }]
        """
        Then we get OK response
        And we store "EVENT_ID" with value "#events._id#" to context
        When we post to "planning/#EVENT_ID#/lock" with success
        """
        {"lock_action": "convert_recurring"}
        """
        And we patch "/events/#EVENT_ID#"
        """
        {
            "lock_action": "convert_recurring",
            "dates": {
                "start": "2099-11-21T12:00:00+0000",
                "end": "2099-11-21T13:00:00+0000",
                "tz": "Europe/Brussels",
                "recurring_rule": {"frequency": "DAILY", "interval": 1, "count": 3, "endRepeatMode": "count"}
            }
        }
        """
        Then we get OK response
        When we get "/events?sort=[("dates.start",1)]"
        Then we store coverage id in "COVERAGE1" from plan 0 coverage 0
        And we get list with 3 items
        """
        {"_items": [
            {
                "_id": "#EVENT_ID#",
                "coverages": [{
                    "coverage_id": "#COVERAGE1#",
                    "planning": {"scheduled": "2099-11-21T14:00:00+0000"}
                }]
            },
            {
                "recurrence_id": "#EVENT_ID#",
                "coverages": [{
                    "original_coverage_id": "#COVERAGE1#",
                    "planning": {"scheduled": "2099-11-22T14:00:00+0000"}
                }]
            },
            {
                "recurrence_id": "#EVENT_ID#",
                "coverages": [{
                    "original_coverage_id": "#COVERAGE1#",
                    "planning": {"scheduled": "2099-11-23T14:00:00+0000"}
                }]
            }
        ]}
        """

    @auth
    Scenario: Add a coverage to all events in a recurring series
        When we post to "/events"
        """
        [{
            "name": "Daily Briefing",
            "dates": {
                "start": "2099-11-21T00:00:00+0000",
                "end": "2099-11-21T00:00:00+0000",
                "tz": "Europe/Brussels",
                "all_day": true,
                "no_end_time": true,
                "recurring_rule": {"frequency": "DAILY", "interval": 1, "count": 3, "endRepeatMode": "count"}
            }
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        When we post to "planning/#EVENT2._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        And we patch "/events/#EVENT2._id#"
        """
        {
            "update_method": "all",
            "coverages": [{
                "coverage_id": "tempId-text",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {"g2_content_type": "text", "scheduled": "2099-11-22T19:00:00+0000"}
            }]
        }
        """
        Then we get OK response
        When we get "/events?sort=[("dates.start",1)]"
        Then we store coverage id in "COVERAGE2" from plan 1 coverage 0
        And we get list with 3 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "coverages": [{
                    "original_coverage_id": "#COVERAGE2#",
                    "planning": {"scheduled": "2099-11-21T19:00:00+0000"}
                }]
            },
            {
                "_id": "#EVENT2._id#",
                "coverages": [{
                    "coverage_id": "#COVERAGE2#",
                    "original_coverage_id": "#COVERAGE2#",
                    "planning": {"scheduled": "2099-11-22T19:00:00+0000"}
                }]
            },
            {
                "_id": "#EVENT3._id#",
                "coverages": [{
                    "original_coverage_id": "#COVERAGE2#",
                    "planning": {"scheduled": "2099-11-23T19:00:00+0000"}
                }]
            }
        ]}
        """

    @auth
    Scenario: Update a coverage in all events in a recurring series
        When we post to "/events"
        """
        [{
            "name": "Daily Briefing",
            "dates": {
                "start": "2099-11-21T12:00:00+0000",
                "end": "2099-11-21T13:00:00+0000",
                "tz": "Europe/Brussels",
                "recurring_rule": {"frequency": "DAILY", "interval": 1, "count": 3, "endRepeatMode": "count"}
            },
            "coverages": [{
                "coverage_id": "tempId-text",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {"g2_content_type": "text", "scheduled": "2099-11-21T14:00:00+0000"}
            }]
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        When we get "/events?sort=[("dates.start",1)]"
        Then we store coverage id in "COVERAGE1" from plan 0 coverage 0
        And we store coverage id in "COVERAGE2" from plan 1 coverage 0
        And we store coverage id in "COVERAGE3" from plan 2 coverage 0
        When we post to "planning/#EVENT2._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        And we patch "/events/#EVENT2._id#"
        """
        {
            "update_method": "all",
            "coverages": [{
                "coverage_id": "#COVERAGE2#",
                "original_coverage_id": "#COVERAGE1#",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "scheduled": "2099-11-22T15:00:00+0000",
                    "internal_note": "Moved one hour later"
                }
            }]
        }
        """
        Then we get OK response
        When we get "/events?sort=[("dates.start",1)]"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "coverages": [{
                    "coverage_id": "#COVERAGE1#",
                    "planning": {"scheduled": "2099-11-21T15:00:00+0000", "internal_note": "Moved one hour later"}
                }]
            },
            {
                "_id": "#EVENT2._id#",
                "coverages": [{
                    "coverage_id": "#COVERAGE2#",
                    "planning": {"scheduled": "2099-11-22T15:00:00+0000", "internal_note": "Moved one hour later"}
                }]
            },
            {
                "_id": "#EVENT3._id#",
                "coverages": [{
                    "coverage_id": "#COVERAGE3#",
                    "planning": {"scheduled": "2099-11-23T15:00:00+0000", "internal_note": "Moved one hour later"}
                }]
            }
        ]}
        """

    @auth
    Scenario: Remove a coverage from all events in a recurring series
        When we post to "/events"
        """
        [{
            "name": "Daily Briefing",
            "dates": {
                "start": "2099-11-21T12:00:00+0000",
                "end": "2099-11-21T13:00:00+0000",
                "tz": "Europe/Brussels",
                "recurring_rule": {"frequency": "DAILY", "interval": 1, "count": 3, "endRepeatMode": "count"}
            },
            "coverages": [{
                "coverage_id": "tempId-text",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {"g2_content_type": "text", "scheduled": "2099-11-21T14:00:00+0000"}
            }]
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        When we post to "planning/#EVENT2._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        And we patch "/events/#EVENT2._id#"
        """
        {"update_method": "all", "coverages": []}
        """
        Then we get OK response
        When we get "/events?sort=[("dates.start",1)]"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "coverages": []},
            {"_id": "#EVENT2._id#", "coverages": []},
            {"_id": "#EVENT3._id#", "coverages": []}
        ]}
        """

    @auth
    Scenario: Each event in a recurring series gets its own assignment
        When we post to "/events"
        """
        [{
            "name": "Daily Briefing",
            "dates": {
                "start": "2099-11-21T12:00:00+0000",
                "end": "2099-11-21T13:00:00+0000",
                "tz": "Europe/Brussels",
                "recurring_rule": {"frequency": "DAILY", "interval": 1, "count": 3, "endRepeatMode": "count"}
            },
            "coverages": [{
                "coverage_id": "tempId-text",
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {"g2_content_type": "text", "scheduled": "2099-11-21T14:00:00+0000"},
                "assigned_to": {"desk": "#desks._id#", "user": "#CONTEXT_USER_ID#"}
            }]
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        When we get "/events?sort=[("dates.start",1)]"
        Then we store coverage id in "COVERAGE1" from plan 0 coverage 0
        And we store coverage id in "COVERAGE2" from plan 1 coverage 0
        And we store coverage id in "COVERAGE3" from plan 2 coverage 0
        When we get "/assignments"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "planning_item": "#EVENT1._id#",
                "coverage_item": "#COVERAGE1#",
                "planning": {"scheduled": "2099-11-21T14:00:00+0000"}
            },
            {
                "planning_item": "#EVENT2._id#",
                "coverage_item": "#COVERAGE2#",
                "planning": {"scheduled": "2099-11-22T14:00:00+0000"}
            },
            {
                "planning_item": "#EVENT3._id#",
                "coverage_item": "#COVERAGE3#",
                "planning": {"scheduled": "2099-11-23T14:00:00+0000"}
            }
        ]}
        """
