Feature: Events Cancel

    @auth
    @notification
    @vocabulary
    Scenario: Changes state to `cancelled`
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
            "lock_action": "cancel",
            "lock_time": "#DATE#"
        }]
        """
        When we perform cancel on events "event1"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {"item": "event1"}
        },
        {
            "event": "events:unlock",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#",
                "lock_session": "#SESSION_ID#",
                "etag": "__any_value__"
            }
        }, {
            "event": "events:cancel",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#",
                "reason": ""
            }
        }]
        """
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "event1",
            "state": "cancelled",
            "lock_user": null,
            "lock_session": null,
            "lock_action": null,
            "lock_time": null
        }]}
        """
        When we get "/events_history?where=event_id==%22event1%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_id": "event1",
            "operation": "events_cancel",
            "update": {"state": "cancelled"}
        }]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Provides `reason` in the notification
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
            "lock_action": "cancel",
            "lock_time": "#DATE#"
        }]
        """
        When we perform cancel on events "event1"
        """
        {"reason": "Cancelling the Event"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {"item": "event1"}
        },
        {
            "event": "events:unlock",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#",
                "lock_session": "#SESSION_ID#",
                "etag": "__any_value__"
            }
        }, {
            "event": "events:cancel",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#",
                "reason": "Cancelling the Event"
            }
        }]
        """
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "event1",
            "state": "cancelled",
            "lock_user": null,
            "lock_session": null,
            "lock_action": null,
            "lock_time": null,
            "reason": "__no_value__"
        }]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Cancelling an Event also cancels associated Planning items
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
            "lock_action": "cancel",
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
            "state": "draft",
            "planning_date": "2016-01-02"
        },
        {
            "_id": "plan2",
            "guid": "plan2",
            "slugline": "TestPlan 2",
            "event_item": "event1",
            "state": "draft",
            "planning_date": "2016-01-02"
        }]
        """
        When we perform cancel on events "event1"
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
            "event": "events:unlock",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#",
                "lock_session": "#SESSION_ID#",
                "etag": "__any_value__"
            }
        }, {
            "event": "events:cancel",
            "extra": {"item": "event1", "user": "#CONTEXT_USER_ID#"}
        },
        {
            "event": "planning:cancelled",
            "extra": {"item": "plan1", "user": "#CONTEXT_USER_ID#"}
        },
        {
            "event": "planning:cancelled",
            "extra": {"item": "plan2", "user": "#CONTEXT_USER_ID#"}
        }]
        """
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "event1",
            "state": "cancelled",
            "lock_user": null,
            "lock_session": null,
            "lock_action": null,
            "lock_time": null
        }]}
        """
        When we get "/planning"
        Then we get a list with 2 items
        """
        {"_items": [
            {
                "_id": "plan1",
                "state": "cancelled"
            },
            {
                "_id": "plan2",
                "state": "cancelled"
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "event_id": "event1",
                "operation": "planning_created",
                "update": {"planning_id": "plan1"}
            },
            {
                "event_id": "event1",
                "operation": "planning_created",
                "update": {"planning_id": "plan2"}
            },
            {
                "event_id": "event1",
                "operation": "events_cancel",
                "update": {"state": "cancelled"}
            }
        ]}
        """
        When we get "/planning_history"
        Then we get list with 2 items
        """
        {"_items": [
            {
                "planning_id": "plan1",
                "operation": "events_cancel",
                "update": {"state": "cancelled"}
            },
            {
                "planning_id": "plan2",
                "operation": "events_cancel",
                "update": {"state": "cancelled"}
            }
        ]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Cancelling a series of recurring Events
        Given we have sessions "/sessions"
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
            "event_item": "#EVENT3._id#",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
        When we post to "/events/#EVENT3._id#/lock" with success
        """
        {"lock_action": "cancel"}
        """
        When we perform cancel on events "#EVENT3._id#"
        """
        {"update_method": "all", "reason": "blaablaa"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "cancelled" },
            { "_id": "#EVENT2._id#", "state": "cancelled" },
            { "_id": "#EVENT3._id#", "state": "cancelled" },
            { "_id": "#EVENT4._id#", "state": "cancelled" }
        ]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Cancelling an Event sets states and notes
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
            "lock_action": "cancel",
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
                "workflow_status": "draft",
                "slugline": "TestCoverage 1",
                "planning": {
                    "internal_note": "Cover something please!",
                    "g2_content_type": "text"
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
            }],
            "planning_date": "2016-01-02"
        }]
        """
        When we perform cancel on events "event1"
        """
        {"reason": "Not happening anymore!"}
        """
        Then we get OK response
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items":[{
            "_id": "event1",
            "state": "cancelled",
            "occur_status": {"qcode": "eocstat:eos6"},
            "lock_user": null,
            "lock_session": null,
            "lock_action": null,
            "lock_time": null,
            "state_reason": "Not happening anymore!"
        }]}
        """
        When we get "/planning"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "plan1",
            "state": "cancelled",
            "state_reason": "Not happening anymore!",
            "coverages": [{
                "coverage_id": "cov1",
                "planning": {
                    "workflow_status_reason": "Not happening anymore!"
                },
                "news_coverage_status": {"qcode": "ncostat:notint"}
            }]
        }]}
        """
        And we get notifications
        """
        [{
            "event": "activity",
            "extra": {
                "activity": {
                "message" : "The event associated with {{coverage_type}} coverage \"{{slugline}}\" has been marked as cancelled",
                "user_name" : "test_user"
                }
            }
        }]
        """

    @auth
    Scenario: Event must be locked to be cancelled
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
            "lock_action": "cancel",
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
            "lock_action": "cancel",
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
        When we perform cancel on events "event1"
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event must be locked"}, "_status": "ERR"}
        """
        When we perform cancel on events "event2"
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event is locked by you in another session"}, "_status": "ERR"}
        """
        When we perform cancel on events "event3"
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event is locked by another user"}, "_status": "ERR"}
        """
        When we perform cancel on events "event4"
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The lock must be for the `cancel` action"}, "_status": "ERR"}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Invalid state errors for event cancellation
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
            "state": "rescheduled",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "cancel",
            "lock_time": "#DATE#"
        }]
        """
        When we perform cancel on events "event1"
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: Event not in valid state for cancellation"}, "_status": "ERR"}
        """
        When we patch "/events/#events._id#"
        """
        {"state": "spiked"}
        """
        Then we get OK response
        When we perform cancel on events "event1"
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: Event not in valid state for cancellation"}, "_status": "ERR"}
        """
        When we patch "/events/#events._id#"
        """
        {"state": "cancelled"}
        """
        Then we get OK response
        When we perform cancel on events "event1"
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: Aborted. Event is already cancelled"}, "_status": "ERR"}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Events in recurring series with invalid state for event cancellation are left alone
        Given we have sessions "/sessions"
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
        When we patch "/events/#EVENT1._id#"
        """
        {"state": "rescheduled"}
        """
        Then we get OK response
        When we patch "/events/#EVENT2._id#"
        """
        {"state": "spiked"}
        """
        Then we get OK response
        When we patch "/events/#EVENT3._id#"
        """
        {"state": "cancelled"}
        """
        Then we get OK response
        When we post to "/events/#EVENT4._id#/lock" with success
        """
        {"lock_action": "cancel"}
        """
        When we perform cancel on events "#EVENT4._id#"
        """
        {"update_method": "all", "reason": "blaablaa"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "rescheduled" },
            { "_id": "#EVENT2._id#", "state": "spiked" },
            { "_id": "#EVENT3._id#", "state": "cancelled" },
            { "_id": "#EVENT4._id#", "state": "cancelled" }
        ]}
        """

    @auth
    @vocabulary
    @notification
    Scenario: Published event gets updated after cancel
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
            "state": "scheduled",
            "pubstatus": "usable",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "cancel",
            "lock_time": "#DATE#"
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
            "destinations": [{"name":"events", "format": "json_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
        }
        """
        When we perform cancel on events "event1"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {"item": "event1"}
        },
        {
            "event": "events:unlock",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#",
                "lock_session": "#SESSION_ID#",
                "etag": "__any_value__"
            }
        }, {
            "event": "events:cancel",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#",
                "reason": ""
            }
        }, {
            "event": "events:posted",
            "extra": {
                "item": "event1"
            }
        }]
        """
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "event1",
            "state": "cancelled",
            "pubstatus": "usable",
            "lock_user": null,
            "lock_session": null,
            "lock_action": null,
            "lock_time": null
        }]}
        """
        When we get "publish_queue"
        Then we get list with 1 items

    @auth
    @notification
    @vocabulary
    Scenario: Multi day event duration is shortened in the actioned_date field
        Given we have sessions "/sessions"
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-27T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "state": "draft",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "cancel",
            "lock_time": "#DATE#"
        }]
        """
        When we perform cancel on events "event1"
        Then we get OK response
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "event1",
            "state": "cancelled",
            "lock_user": null,
            "lock_session": null,
            "lock_action": null,
            "lock_time": null,
            "actioned_date": "2029-11-21T12:00:00+0000"
        }]}
        """

    @auth
    @vocabulary
    Scenario: Reason can be configured as required field based on configuration
        Given "planning_types"
        """
        [
            {
                "_id": "event_cancel",
                "name": "event_cancel",
                "schema": {
                    "reason": {
                        "required": true
                    }
                }
            }
        ]
        """
        And we have sessions "/sessions"
        And "events"
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
            "lock_action": "cancel",
            "lock_time": "#DATE#"
        }]
        """
        When we perform cancel on events "event1"
        Then we get error 400
        When we perform cancel on events "event1"
        """
        {"reason": "cancelling event"}
        """
        Then we get OK response


    @auth
    @notification
    @vocabulary
    Scenario: Cancelling a series of recurring Events with reason as compulsory
        Given we have sessions "/sessions"
        And "planning_types"
        """
        [
            {
                "_id": "event_cancel",
                "name": "event_cancel",
                "schema": {
                    "reason": {
                        "required": true
                    }
                }
            }
        ]
        """
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
            "event_item": "#EVENT3._id#",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
        When we post to "/events/#EVENT3._id#/lock" with success
        """
        {"lock_action": "cancel"}
        """
        When we perform cancel on events "#EVENT3._id#"
        """
        {"update_method": "all"}
        """
        Then we get error 400
        When we perform cancel on events "#EVENT3._id#"
        """
        {"update_method": "all", "reason": "cancelled"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "cancelled" },
            { "_id": "#EVENT2._id#", "state": "cancelled" },
            { "_id": "#EVENT3._id#", "state": "cancelled" },
            { "_id": "#EVENT4._id#", "state": "cancelled" }
        ]}
        """
