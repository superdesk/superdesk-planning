Feature: Events Postpone

    @auth
    @notification
    @vocabulary
    Scenario: Changes state to `postponed`
        Given we have sessions "/sessions"
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "state": "draft",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "postpone",
            "lock_time": "#DATE#"
        }]
        """
        When we perform postpone on events "event1"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {"item": "event1"}
        },
        {
            "event": "events:postpone",
            "extra": {"item": "event1","user": "#CONTEXT_USER_ID#"}
        }]
        """
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "event1",
            "state": "postponed",
            "lock_user": null,
            "lock_session": null
        }]}
        """
        When we get "/events_history?where=event_id==%22event1%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_id": "event1",
            "operation": "postpone",
            "update": {"state": "postponed"}
        }]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Postponing an Event also postpones associated Planning items
        Given we have sessions "/sessions"
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "state": "draft",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "postpone",
            "lock_time": "#DATE#"
        }]
        """
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "slugline": "TestPlan 1",
            "event_item": "event1",
            "state": "draft"
        },
        {
            "_id": "plan2",
            "guid": "plan2",
            "slugline": "TestPlan 2",
            "event_item": "event1",
            "state": "draft"
        }]
        """
        When we perform postpone on events "event1"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {"item": "event1"}
        },
        {
            "event": "planning:created",
            "extra": {"item": "plan1"}
        },
        {
            "event": "planning:created",
            "extra": {"item": "plan2"}
        },
        {
            "event": "events:postpone",
            "extra": {"item": "event1", "user": "#CONTEXT_USER_ID#"}
        },
        {
            "event": "planning:postponed",
            "extra": {"item": "plan1", "user": "#CONTEXT_USER_ID#"}
        },
        {
            "event": "planning:postponed",
            "extra": {"item": "plan2", "user": "#CONTEXT_USER_ID#"}
        }]
        """
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "event1",
            "state": "postponed"
        }]}
        """
        When we get "/planning"
        Then we get a list with 2 items
        """
        {"_items": [
            {
                "_id": "plan1",
                "state": "postponed"
            },
            {
                "_id": "plan2",
                "state": "postponed"
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "event_id": "event1",
                "operation": "planning created",
                "update": {"planning_id": "plan1"}
            },
            {
                "event_id": "event1",
                "operation": "planning created",
                "update": {"planning_id": "plan2"}
            },
            {
                "event_id": "event1",
                "operation": "postpone",
                "update": {"state": "postponed"}
            }
        ]}
        """
        When we get "/planning_history"
        Then we get list with 2 items
        """
        {"_items": [
            {
                "planning_id": "plan1",
                "operation": "postpone",
                "update": {"state": "postponed"}
            },
            {
                "planning_id": "plan2",
                "operation": "postpone",
                "update": {"state": "postponed"}
            }
        ]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Postponing a series of recurring Events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            },
            "state": "draft"
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
            "slugline": "Weekly Meetings",
            "headline": "Friday Club",
            "event_item": "#EVENT3._id#"
        }]
        """
        Then we get OK response
        When we post to "/events/#EVENT3._id#/lock" with success
        """
        {"lock_action": "postpone"}
        """
        When we perform postpone on events "#EVENT3._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "postponed" },
            { "_id": "#EVENT2._id#", "state": "postponed" },
            { "_id": "#EVENT3._id#", "state": "postponed" },
            { "_id": "#EVENT4._id#", "state": "postponed" }
        ]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Postponing future events in a series of recurring Events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 5,
                    "endRepeatMode": "count"
                }
            },
            "state": "draft"
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        Then we store "EVENT5" with 5 item
        When we post to "planning"
        """
        [{
            "slugline": "Weekly Meetings",
            "headline": "Friday Club",
            "event_item": "#EVENT3._id#"
        }]
        """
        Then we get OK response
        When we post to "/events/#EVENT3._id#/lock" with success
        """
        {"lock_action": "postpone"}
        """
        When we perform postpone on events "#EVENT3._id#"
        """
        {"update_method": "future"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 5 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "draft" },
            { "_id": "#EVENT2._id#", "state": "draft" },
            { "_id": "#EVENT3._id#", "state": "postponed" },
            { "_id": "#EVENT4._id#", "state": "postponed" },
            { "_id": "#EVENT5._id#", "state": "postponed" }
        ]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Postponing an Event sets item notes
        Given we have sessions "/sessions"
        Given "desks"
        """
        [{"_id": "desk_123", "name": "Politic Desk"}]
        """
        Given "assignments"
        """
        [{
            "_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "text"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }]
        """
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "ednote":  "An event with exciting things",
            "occur_status": {
                "qcode": "eocstat:eos5",
                "name": "Planned, occurs certainly"
            },
            "state": "draft",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "postpone",
            "lock_time": "#DATE#"
        }]
        """
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "slugline": "TestPlan 1",
            "event_item": "event1",
            "ednote": "We're covering this Event",
            "state": "draft",
            "coverages": [{
                "coverage_id": "cov1",
                "slugline": "TestCoverage 1",
                "planning": {
                    "internal_note": "Cover something please!"
                },
                "planning_item": "plan1",
                "news_coverage_status": {
                    "qcode": "ncostat:int",
                    "name": "Coverage intended"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "assignment_id": "aaaaaaaaaaaaaaaaaaaaaaaa"
                }
            }]
        }]
        """
        When we perform postpone on events "event1"
        """
        {"reason": "Not happening anymore!"}
        """
        Then we get OK response
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items":[{
            "_id": "event1",
            "state": "postponed",
            "ednote": "An event with exciting things\n\n------------------------------------------------------------\nEvent Postponed\nReason: Not happening anymore!\n"
        }]}
        """
        When we get "/planning"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "plan1",
            "state": "postponed",
            "ednote": "We're covering this Event\n\n------------------------------------------------------------\nEvent Postponed\nReason: Not happening anymore!\n",
            "coverages": [{
                "coverage_id": "cov1",
                "planning": {
                    "internal_note": "Cover something please!\n\n------------------------------------------------------------\nEvent has been postponed\nReason: Not happening anymore!\n"
                }
            }]
        }]}
        """
        And we get notifications
        """
        [{
            "event": "activity",
            "extra": {
                "activity": {
                "message" : "The event associated with {{coverage_type}} coverage \"{{slugline}}\" has been marked as postponed",
                "user_name" : "test_user"
                }
            }
        }]
        """

    @auth
    Scenario: Event must be locked to be postponed
        Given we have sessions "/sessions"
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "event2",
            "guid": "event2",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "session123",
            "lock_action": "postpone",
            "lock_time": "#DATE#"
        }, {
            "_id": "event3",
            "guid": "event3",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "lock_user": "user123",
            "lock_session": "session456",
            "lock_action": "postpone",
            "lock_time": "#DATE#"
        }, {
            "_id": "event4",
            "guid": "event4",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }]
        """
        When we perform postpone on events "event1"
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event must be locked"}, "_status": "ERR"}
        """
        When we perform postpone on events "event2"
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event is locked by you in another session"}, "_status": "ERR"}
        """
        When we perform postpone on events "event3"
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event is locked by another user"}, "_status": "ERR"}
        """
        When we perform postpone on events "event4"
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The lock must be for the `postpone` action"}, "_status": "ERR"}
        """

    @auth
    @notification
    Scenario: Published event gets updated after postpone
        Given we have sessions "/sessions"
        Given "desks"
        """
        [{"_id": "desk_123", "name": "Politic Desk"}]
        """
        Given "assignments"
        """
        [{
            "_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "text"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }]
        """
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "ednote":  "An event with exciting things",
            "occur_status": {
                "qcode": "eocstat:eos5",
                "name": "Planned, occurs certainly"
            },
            "state": "scheduled",
            "pubstatus": "usable",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "postpone",
            "lock_time": "#DATE#"
        }]
        """
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "slugline": "TestPlan 1",
            "event_item": "event1",
            "ednote": "We're covering this Event",
            "state": "draft",
            "coverages": [{
                "coverage_id": "cov1",
                "slugline": "TestCoverage 1",
                "planning": {
                    "internal_note": "Cover something please!"
                },
                "planning_item": "plan1",
                "news_coverage_status": {
                    "qcode": "ncostat:int",
                    "name": "Coverage intended"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "assignment_id": "aaaaaaaaaaaaaaaaaaaaaaaa"
                }
            }]
        }]
        """
        When we post to "/products" with success
        """
        {
            "name":"prod-1","codes":"abc,xyz", "product_type": "both"
        }
        """
        And we post to "/subscribers" with success
        """
        {
            "name":"News1","media_type":"media", "subscriber_type": "digital", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
            "products": ["#products._id#"],
            "codes": "xyz, abc",
            "destinations": [{"name":"events", "format": "ntb_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
        }
        """
        When we perform postpone on events "event1"
        """
        {"reason": "Not happening anymore!"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {"item": "event1"}
        },
        {
            "event": "events:postpone",
            "extra": {"item": "event1","user": "#CONTEXT_USER_ID#"}
        },
        {
            "event": "events:published",
            "extra": {"item": "event1"}
        }]
        """
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items":[{
            "_id": "event1",
            "state": "postponed",
            "ednote": "An event with exciting things\n\n------------------------------------------------------------\nEvent Postponed\nReason: Not happening anymore!\n",
            "pubstatus": "usable"

        }]}
        """
        When we get "publish_queue"
        Then we get list with 1 items