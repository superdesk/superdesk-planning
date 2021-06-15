Feature: Events Recurring

    @auth
    @notification
    Scenario: Create new recurring events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        Then we get a list with 3 items
        """
        {"_items": [
            {
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000"
                },
                "name": "Friday Club"
            }, {
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000"
                },
                "name": "Friday Club"
            }, {
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000"
                },
                "name": "Friday Club"
            }
        ]}
        """
        When we get "/events?source={"query":{"match":{"recurrence_id": "#EVENT1.recurrence_id#"}}}"
        Then we get list with 3 items
        When we get "/events_history"
        Then we get list with 3 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"}
        ]}
        """

    @auth
    @notification
    Scenario: Convert a single event to be a recurring event with invalid data
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z"
            }
        }]
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        And we store "EVENT_ID" with value "#events._id#" to context
        When we reset notifications
        When we post to "/events/#events._id#/lock" with success
        """
        {"lock_action": "convert_recurring"}
        """
        And we patch "/events/#EVENT_ID#"
        """
        {
            "name": "Weekly Friday Club",
            "lock_action": "convert_recurring"
        }
        """
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "400: Event recurring rules are mandatory for convert to recurring action."
                },
            "_status": "ERR"
        }
        """

    @auth
    @notification
    Scenario: Recurring event cannot be convert to recurring event
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z"
            }
        }]
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        And we store "EVENT_ID" with value "#events._id#" to context
        When we reset notifications
        When we post to "/events/#events._id#/lock" with success
        """
        {"lock_action": "convert_recurring"}
        """
        And we patch "/events/#EVENT_ID#"
        """
        {
            "name": "Weekly Friday Club",
            "lock_action": "convert_recurring",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        And we store "EVENT2" with 2 item
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "convert_recurring"}
        """
        When we patch "/events/#EVENT2._id#"
        """
        {
            "name": "Weekly Friday Club",
            "lock_action": "convert_recurring",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "400: Event is already converted to recurring event."
            },
            "_status": "ERR"
        }
        """

    @auth
    @notification
    Scenario: Convert a single event to be a recurring event
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z"
            }
        }]
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        And we store "EVENT_ID" with value "#events._id#" to context
        When we reset notifications
        When we post to "/events/#events._id#/lock" with success
        """
        {"lock_action": "convert_recurring"}
        """
        And we patch "/events/#EVENT_ID#"
        """
        {
            "name": "Weekly Friday Club",
            "lock_action": "convert_recurring",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated:recurring",
            "extra": {
                "item": "#EVENT_ID#",
                "recurrence_id": "__any_value__",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        Then we store "NEW_RECURRING" from patch
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }, {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }, {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 4 items
        """
        {"_items": [
            {"operation": "create", "event_id": "__any_value__"},
            {"operation": "create", "event_id": "__any_value__"},
            {"operation": "create", "event_id": "__any_value__"},
            {"operation": "convert_recurring", "event_id": "#EVENT_ID#", "update": {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count",
                        "until": null
                    }
                }
            }}
        ]}
        """

    @auth
    @notification
    Scenario: Converting a posted event to be a recurring event will reschedule and update it
        Given we have sessions "/sessions"
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "state": "scheduled",
            "pubstatus": "usable",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "convert_recurring",
            "lock_time": "#DATE#"
        }]
        """
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "slugline": "TestPlan",
            "event_item": "event1",
            "state": "scheduled",
            "pubstatus": "usable",
            "ednote": "We planned this.",
            "coverages": [
                {
                    "coverage_id": "cov1",
                    "workflow_status": "draft",
                    "planning": {
                        "internal_note": "Please write words."
                    },
                    "news_coverage_status": {
                        "qcode": "ncostat:int",
                        "name": "Coverage intended"
                    }
                }
            ],
            "planning_date": "2016-01-02"
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
        When we patch "/events/event1"
        """
        {
            "name": "Weekly Friday Club",
            "lock_action": "convert_recurring",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        Then we store "NEW_RECURRING" from patch
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "_id": "event1",
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-11-21T12:00:00+0000",
                    "end": "2019-11-21T14:00:00+0000"
                },
                "state": "rescheduled",
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            },
            {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }, {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }, {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }
        ]}
        """
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "state": "rescheduled",
            "recurrence_id": "#NEW_RECURRING.recurrence_id#"
        }
        """
        When we get "/planning/plan1"
        Then we get existing resource
        """
        {
            "slugline": "TestPlan",
            "state": "rescheduled",
            "event_item": "event1",
            "recurrence_id": "#NEW_RECURRING.recurrence_id#"
        }
        """
        When we get "/events_history"
        Then we get list with 10 items
        """
        {"_items": [
            {"operation": "post", "event_id": "#events._id#"},
            {"operation": "planning_created", "event_id": "#events._id#"},
            {"operation": "reschedule_from", "event_id": "__any_value__"},
            {"operation": "reschedule", "event_id": "#events._id#"},
            {"operation": "create", "event_id": "__any_value__"},
            {"operation": "create", "event_id": "__any_value__"},
            {"operation": "convert_recurring", "event_id": "#events._id#"}
        ]}
        """
        When we get "publish_queue"
        Then we get list with 4 items

    @auth
    Scenario: Convert a single event to a recurring event with only recurring_rules in the patch
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z"
            }
        }]
        """
        Then we get OK response
        And we store "EVENT_ID" with value "#events._id#" to context
        When we post to "/events/#events._id#/lock" with success
        """
        {"lock_action": "convert_recurring"}
        """
        And we patch "/events/#EVENT_ID#"
        """
        {
            "dates": {
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        And we store "NEW_RECURRING" from patch
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }
        ]}
        """

    @auth
    Scenario: Spike single event from recurring series
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
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we spike events "#EVENT2._id#"
        """
        { "update_method": "single" }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "draft" },
            { "_id": "#EVENT2._id#", "state": "spiked" },
            { "_id": "#EVENT3._id#", "state": "draft" },
            { "_id": "#EVENT4._id#", "state": "draft" }
        ]}
        """

    @auth
    Scenario: Spike future events from recurring series
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
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we spike events "#EVENT2._id#"
        """
        { "update_method": "future" }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "draft" },
            { "_id": "#EVENT2._id#", "state": "spiked" },
            { "_id": "#EVENT3._id#", "state": "spiked" },
            { "_id": "#EVENT4._id#", "state": "spiked" }
        ]}
        """

    @auth
    Scenario: Spike all events from recurring series
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
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we spike events "#EVENT2._id#"
        """
        { "update_method": "all" }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "spiked" },
            { "_id": "#EVENT2._id#", "state": "spiked" },
            { "_id": "#EVENT3._id#", "state": "spiked" },
            { "_id": "#EVENT4._id#", "state": "spiked" }
        ]}
        """

    @auth
    Scenario: Spike all recurring doesnt spike historic events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
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
        When we spike events "#EVENT3._id#"
        """
        { "update_method": "all" }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "draft" },
            { "_id": "#EVENT2._id#", "state": "draft" },
            { "_id": "#EVENT3._id#", "state": "spiked" },
            { "_id": "#EVENT4._id#", "state": "spiked" }
        ]}
        """

    @auth
    @notification
    Scenario: Update metadata of single event in recurring series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
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
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        And we patch "/events/#EVENT2._id#"
        """
        {
            "name": "Friday Club - altered",
            "definition_short": "Something different today"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated",
            "extra": {
                "item": "#EVENT2._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "name": "Friday Club" },
            {
                "_id": "#EVENT2._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            },
            { "_id": "#EVENT3._id#", "name": "Friday Club" }

        ]}
        """
        When we get "/events_history"
        Then we get list with 4 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"},
            {"operation": "edited", "event_id": "#EVENT2._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }}
        ]}
        """

    @auth
    @notification
    Scenario: Update metadata of future events in recurring series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
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
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        And we patch "/events/#EVENT2._id#"
        """
        {
            "name": "Friday Club - altered",
            "definition_short": "Something different today",
            "update_method": "future"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "name": "Friday Club" },
            {
                "_id": "#EVENT2._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            },
            {
                "_id": "#EVENT3._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 5 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"},
            {"operation": "edited", "event_id": "#EVENT2._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }},
            {"operation": "edited", "event_id": "#EVENT3._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }}
        ]}
        """

    @auth
    @notification
    Scenario: Update metadata of all events in recurring series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
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
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        And we patch "/events/#EVENT2._id#"
        """
        {
            "name": "Friday Club - altered",
            "definition_short": "Something different today",
            "update_method": "all"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            },
            {
                "_id": "#EVENT2._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            },
            {
                "_id": "#EVENT3._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 6 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"},
            {"operation": "edited", "event_id": "#EVENT1._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }},
            {"operation": "edited", "event_id": "#EVENT2._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }},
            {"operation": "edited", "event_id": "#EVENT3._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }}
        ]}
        """

    @auth
    @notification
    Scenario: Update metadata of all events in recurring series will not update 'rescheduled', 'spiked, 'cancelled' events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 5,
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
        Then we store "EVENT5" with 5 item
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
        When we patch "/events/#EVENT4._id#"
        """
        {
            "name": "Friday Club - altered",
            "definition_short": "Something different today",
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 5 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "name": "Friday Club"
            },
            {
                "_id": "#EVENT2._id#",
                "name": "Friday Club"
            },
            {
                "_id": "#EVENT3._id#",
                "name": "Friday Club"
            },
            {
                "_id": "#EVENT4._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            },
            {
                "_id": "#EVENT5._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }
        ]}
        """

    @auth
    Scenario: Create new Recurring Events from a Planning item
        Given we have sessions "/sessions"
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "slugline": "TestPlanning",
            "state": "draft",
            "planning_date": "2016-01-02"
        }]
        """
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "_planning_item": "plan1",
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        When we get "/planning/plan1"
        Then we get existing resource
        """
        {
            "slugline": "TestPlanning",
            "event_item": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#"
        }
        """
        When we get "/events/#EVENT1._id#"
        Then we get existing resource
        """
        {
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-21T02:00:00+0000",
                "end": "2029-11-21T04:00:00+0000"
            },
            "planning_ids": ["plan1"]
        }
        """
        When we get "/events/#EVENT2._id#"
        Then we get existing resource
        """
        {
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-22T02:00:00+0000",
                "end": "2029-11-22T04:00:00+0000"
            },
            "planning_ids": "__no_value__"
        }
        """
        When we get "/events/#EVENT3._id#"
        Then we get existing resource
        """
        {
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-23T02:00:00+0000",
                "end": "2029-11-23T04:00:00+0000"
            },
            "planning_ids": "__no_value__"
        }
        """

    @auth
    Scenario: Validate recurring rules
    When we post to "events"
    """
    [{
        "name": "Friday Club",
        "dates": {
            "start": "2019-11-21T12:00:00.000Z",
            "end": "2019-11-21T14:00:00.000Z",
            "tz": "Australia/Sydney",
            "recurring_rule": {
                "frequency": "WEEKLY",
                "interval": 1,
                "byday": "FR",
                "endRepeatMode": "count"
            }
        }
    }]
    """
    Then we get error 400
    """
    {"_message": "Recurring event should have an end (until or count)"}
    """

    @auth
    Scenario: Assign calendar to series
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        When we post to "/events/#EVENT1._id#/lock" with success
        """
        {"lock_action": "assign_calendar"}
        """
        And we patch "/events/#EVENT1._id#"
        """
        {
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true}
            ],
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }, {
            "_id": "#EVENT2._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }, {
            "_id": "#EVENT3._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }]}
        """
        When we post to "/events/#EVENT1._id#/unlock" with success
        """
        {}
        """
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "assign_calendar"}
        """
        And we patch "/events/#EVENT2._id#"
        """
        {
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true},
                {"qcode": "Company Meetings", "name": "Company Meetings", "is_active": true}
            ],
            "update_method": "future"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }, {
            "_id": "#EVENT2._id#",
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true},
                {"qcode": "Company Meetings", "name": "Company Meetings", "is_active": true}
            ]
        }, {
            "_id": "#EVENT3._id#",
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true},
                {"qcode": "Company Meetings", "name": "Company Meetings", "is_active": true}
            ]
        }]}
        """
        When we patch "/events/#EVENT2._id#"
        """
        {
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true},
                {"qcode": "Company Meetings", "name": "Company Meetings", "is_active": true},
                {"qcode": "Awards", "name": "Awards", "is_active": true}
            ],
            "update_method": "single"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }, {
            "_id": "#EVENT2._id#",
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true},
                {"qcode": "Company Meetings", "name": "Company Meetings", "is_active": true},
                {"qcode": "Awards", "name": "Awards", "is_active": true}
            ]
        }, {
            "_id": "#EVENT3._id#",
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true},
                {"qcode": "Company Meetings", "name": "Company Meetings", "is_active": true}
            ]
        }]}
        """

    @auth
    Scenario: Assigning Calendars does not result in duplicate calendars
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "assign_calendar"}
        """
        And we patch "/events/#EVENT2._id#"
        """
        {
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true}
            ],
            "update_method": "future"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "calendars": "__no_value__"
        }, {
            "_id": "#EVENT2._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }, {
            "_id": "#EVENT3._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }]}
        """
        When we post to "/events/#EVENT2._id#/unlock" with success
        """
        {}
        """
        When we post to "/events/#EVENT1._id#/lock" with success
        """
        {"lock_action": "assign_calendar"}
        """
        And we patch "/events/#EVENT1._id#"
        """
        {
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true}
            ],
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }, {
            "_id": "#EVENT2._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }, {
            "_id": "#EVENT3._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }]}
        """

    @auth
    Scenario: Editing calendars overwrites all in series
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "assign_calendar"}
        """
        And we patch "/events/#EVENT2._id#"
        """
        {
            "calendars": [
                {"qcode": "ann", "name": "Anniversaries", "is_active": true}
            ],
            "update_method": "future"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "calendars": "__no_value__"
        }, {
            "_id": "#EVENT2._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }, {
            "_id": "#EVENT3._id#",
            "calendars": [{"qcode": "ann", "name": "Anniversaries", "is_active": true}]
        }]}
        """
        When we post to "/events/#EVENT2._id#/unlock" with success
        """
        {}
        """
        When we post to "/events/#EVENT1._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        And we patch "/events/#EVENT1._id#"
        """
        {
            "calendars": [
                {"qcode": "Awards", "name": "Awards", "is_active": true}
            ],
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "calendars": [{"qcode": "Awards", "name": "Awards", "is_active": true}]
        }, {
            "_id": "#EVENT2._id#",
            "calendars": [{"qcode": "Awards", "name": "Awards", "is_active": true}]
        }, {
            "_id": "#EVENT3._id#",
            "calendars": [{"qcode": "Awards", "name": "Awards", "is_active": true}]
        }]}
        """
