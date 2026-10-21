Feature: Events - Mark as Completed
    @auth
    Scenario: Can mark an Event as completed
        When we post to "events"
        """
        [{
            "name": "Long Event",
            "dates": {
                "start": "#DATE-1#",
                "end": "#DATE+2#",
                "tz": "Australia/Sydney"
            }
        }]
        """
        Then we get OK response
        When we post to "planning/#events._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "#events.dates.start#"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#events._id#", "completed": true, "actioned_date": "#events.dates.start#"}
        ]}
        """
        When we get "/planning_history"
        Then we get list with 2 items
        """
        {"_items": [
            {"operation": "create", "item_id": "#events._id#", "item_type": "event"},
            {
                "operation": "edited", "item_id": "#events._id#", "item_type": "event",
                "update": {"completed": true, "actioned_date": "#events.dates.start#"}
            }
        ]}
        """

    @auth
    @notification
    @vocabularies
    @planning_cvs
    Scenario: Marking an event as complete will cancel related coverages
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60}]
        """
        When we post to "/planning"
        """
        [{"slugline": "test slugline", "planning_date": "#DATE#"}]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "workflow_status": "draft",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type": "text",
                    "scheduled": "#DATE#"
                },
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we reset notifications
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {"ednote": "test coverage, I want 250 words", "slugline": "test slugline"},
            "assigned_to": {"desk": "#desks._id#", "user": "#CONTEXT_USER_ID#", "state": "draft"}
        }
        """
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "_planning_item": "#planning._id#",
            "dates": {"start": "#DATE#", "end": "#DATE+1#", "tz": "Australia/Sydney"}
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"related_events": [{"_id": "#events._id#", "link_type": "primary"}]}
        """
        When we post to "planning/#events._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "#events.dates.start#"}
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {"completed": true, "actioned_date": "#events.dates.start#"}
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "slugline": "test slugline",
            "coverages": [{
                "workflow_status": "cancelled",
                "planning": {
                    "workflow_status_reason": "Event Completed",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "cancelled"
                }
            }]
        }
        """

    @auth
    @notification
    @vocabularies
    @planning_cvs
    Scenario: Marking an event as complete will unlink related news items
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60}]
        """
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{"slugline": "test slugline", "planning_date": "#DATE#"}]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "workflow_status": "active",
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type": "text",
                    "scheduled": "#DATE#"
                },
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "assigned_to": {"desk": "#desks._id#", "user": "#CONTEXT_USER_ID#"}
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we reset notifications
        When we post to "assignments/link"
        """
        [{"assignment_id": "#firstassignment#", "item_id": "#archive._id#", "reassign": true}]
        """
        Then we get OK response
        Then we get notifications
        """
        [{"event": "content:update"}, {"event": "content:link"}]
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#firstassignment#"}
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {"ednote": "test coverage, I want 250 words", "slugline": "test slugline"},
            "assigned_to": {"desk": "#desks._id#", "user": "#CONTEXT_USER_ID#", "state": "in_progress"}
        }
        """
        When we get "/assignments_history"
        Then we get list with 2 items
        """
        {"_items": [
            {"item_id": "#firstassignment#", "item_type": "assignment", "operation": "create"},
            {"item_id": "#firstassignment#", "item_type": "assignment", "operation": "content_link"}
        ]}
        """
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "_planning_item": "#planning._id#",
            "dates": {"start": "#DATE#", "end": "#DATE+1#", "tz": "Australia/Sydney"}
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"related_events": [{"_id": "#events._id#", "link_type": "primary"}]}
        """
        When we post to "planning/#events._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "#events.dates.start#"}
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {"completed": true, "actioned_date": "#events.dates.start#"}
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "slugline": "test slugline",
            "coverages": [{
                "workflow_status": "cancelled",
                "planning": {
                    "workflow_status_reason": "Event Completed",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "cancelled"
                }
            }]
        }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": null}
        """

    @auth
    Scenario: Marking an Event as completed fails if invalid actioned_date provided
        When we post to "events"
        """
        [{
            "name": "Long Event",
            "dates": {
                "start": "#DATE-1#",
                "end": "#DATE+2#",
                "tz": "Australia/Sydney"
            }
        }]
        """
        Then we get OK response
        When we post to "planning/#events._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "foo_bar_123"}
        """
        Then we get error 400
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "#events.dates.start#"}
        """
        Then we get OK response

    @auth
    Scenario: Marking an Event completed fails if actioned_date doesn't fall within the Event schedule
        When we post to "events"
        """
        [{
            "name": "Long Event",
            "dates": {
                "start": "#DATE-1#",
                "end": "#DATE+2#",
                "tz": "Australia/Sydney"
            }
        }]
        """
        Then we get OK response
        When we post to "planning/#events._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "#DATE-5#"}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"validator exception": "400: Completed date is before Event start date."}
        }
        """
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "#DATE+5#"}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"validator exception": "400: Completed date is after Event end date."}
        }
        """
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "#DATE+1#"}
        """
        Then we get OK response

    @auth
    Scenario: Marking an Event completed fails if the Event has already completed
        When we post to "events"
        """
        [{
            "name": "Long Event",
            "dates": {
                "start": "#DATE-5#",
                "end": "#DATE-1#",
                "tz": "Australia/Sydney"
            }
        }]
        """
        Then we get OK response
        When we post to "planning/#events._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "#DATE-3#"}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"validator exception": "400: Event has already finished."}
        }
        """

    @auth
    Scenario: Marking an Event completed fails if the Event hasn't started yet
        When we post to "events"
        """
        [{
            "name": "Long Event",
            "dates": {
                "start": "#DATE+1#",
                "end": "#DATE+3#",
                "tz": "Australia/Sydney"
            }
        }]
        """
        Then we get OK response
        When we post to "planning/#events._id#/lock"
        """
        {"lock_action": "mark_completed"}
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {"completed": true, "actioned_date": "#DATE-3#"}
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"validator exception": "400: Event has not started."}
        }
        """
