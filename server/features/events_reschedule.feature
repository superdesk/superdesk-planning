Feature: Events Reschedule

    @auth
    @notification
    Scenario: Changes state to `rescheduled`
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "TestEvent",
            "definition_long": "Something happening.",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "state": "scheduled",
            "pubstatus": "usable",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "session123",
            "lock_action": "reschedule",
            "lock_time": "#DATE#"
        }]
        """
        When we perform reschedule on events "event1"
        """
        {
            "reason": "Changed to the next day!",
            "dates": {
                "start": "2029-11-22T12:00:00.000Z",
                "end": "2029-11-22T14:00:00.000Z"
            }
        }
        """
        Then we get OK response
        Then we store "DUPLICATE" from last duplicated item
        And we get notifications
        """
        [{
            "event": "events:rescheduled",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events/#DUPLICATE.id#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "state": "draft",
            "duplicate_from": "event1",
            "lock_user": "__no_value__",
            "lock_session": "__no_value__",
            "lock_action": "__no_value__",
            "lock_time": "__no_value__",
            "dates": {
                "start": "2029-11-22T12:00:00+0000",
                "end": "2029-11-22T14:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }
        """
        When we get "/events/event1"
        Then we get existing resource
        """
        {
            "state": "rescheduled",
            "duplicate_to": ["#DUPLICATE.id#"],
            "lock_user": null,
            "lock_session": null,
            "lock_action": null,
            "lock_time": null,
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "definition_long": "Something happening.\n\n------------------------------------------------------------\nEvent Rescheduled\nReason: Changed to the next day!\n"
        }
        """
        When we get "/events_history"
        Then we get list with 2 items
        """
        {"_items": [
            {"operation": "reschedule", "event_id": "event1", "update": {
                "duplicate_to": ["#DUPLICATE.id#"]
            }},
            {"operation": "reschedule_from", "event_id": "#DUPLICATE.id#", "update": {
                "duplicate_from": "event1"
            }}
        ]}
        """

    @auth
    @notification
    Scenario: Changes associated Planning items to `rescheduled`
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
            "lock_session": "session123",
            "lock_action": "reschedule",
            "lock_time": "#DATE#"
        }]
        """
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "slugline": "TestEvent",
            "event_item": "event1",
            "state": "scheduled",
            "pubstatus": "usable",
            "ednote": "We planned this.",
            "coverages": [{
                "coverage_id": "cov1",
                "planning": {
                    "internal_note": "Please write words."
                }
            }]
        }]
        """
        When we perform reschedule on events "event1"
        """
        {
            "reason": "Changing to the next day!",
            "dates": {
                "start": "2029-11-22T12:00:00.000Z",
                "end": "2029-11-22T14:00:00.000Z"
            }
        }
        """
        Then we get OK response
        Then we store "DUPLICATE" from last duplicated item
        And we get notifications
        """
        [{
            "event": "events:rescheduled",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#"
            }
        }, {
            "event": "planning:rescheduled",
            "extra": {
                "item": "plan1",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/planning/plan1"
        Then we get existing resource
        """
        {
            "state": "rescheduled",
            "pubstatus": "usable",
            "ednote" : "We planned this.\n\n------------------------------------------------------------\nEvent Rescheduled\nReason: Changing to the next day!\n",
            "coverages": [{
                "coverage_id": "cov1",
                "planning": {
                    "internal_note": "Please write words.\n\n------------------------------------------------------------\nEvent has been rescheduled\nReason: Changing to the next day!\n"
                }
            }]
        }
        """


    @auth
    @notification
    Scenario: Reschedule a series of recurring events
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
            "state": "draft"
        }]
        """
        Then we get OK response
        When we perform reschedule on events "#EVENT2._id#"
        """
        {
            "reason": "Changed to the next day!",
            "dates": {
                "start": "2099-11-23T13:00:00.000Z",
                "end": "2099-11-23T15:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            },
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 5 items
        """
        {"_items": [
            {
                "state": "draft",
                "dates": {
                    "start": "2099-11-22T13:00:00+0000",
                    "end": "2099-11-22T15:00:00+0000"
                },
                "recurrence_id": "#EVENT1.recurrence_id#"
            },
            {
                "_id": "#EVENT3._id#",
                "state": "rescheduled",
                "dates": {
                    "start": "2099-11-23T12:00:00+0000",
                    "end": "2099-11-23T14:00:00+0000"
                },
                "recurrence_id": "#EVENT1.recurrence_id#",
                "definition_long": "------------------------------------------------------------\nEvent Rescheduled\nReason: Changed to the next day!\n"
            },
            {
                "state": "draft",
                "dates": {
                    "start": "2099-11-23T13:00:00+0000",
                    "end": "2099-11-23T15:00:00+0000"
                },
                "recurrence_id": "#EVENT1.recurrence_id#"
            },
            {
                "state": "draft",
                "dates": {
                    "start": "2099-11-24T13:00:00+0000",
                    "end": "2099-11-24T15:00:00+0000"
                },
                "recurrence_id": "#EVENT1.recurrence_id#"
            },
            {
                "state": "draft",
                "dates": {
                    "start": "2099-11-25T13:00:00+0000",
                    "end": "2099-11-25T15:00:00+0000"
                },
                "recurrence_id": "#EVENT1.recurrence_id#"
            }
        ]}
        """
        When we get "/events/#EVENT1._id#"
        Then we get error 404
        When we get "/events/#EVENT2._id#"
        Then we get error 404
        When we get "/events/#EVENT3._id#"
        Then we get OK response
        When we get "/events/#EVENT4._id#"
        Then we get error 404
        When we get "/planning"
        Then we get a list with 1 items
        """
        {"_items": [{
            "slugline": "Weekly Meetings",
            "headline": "Friday Club",
            "event_item": "#EVENT3._id#",
            "state": "rescheduled"
        }]}
        """

    @auth
    @notification
    Scenario: Increase number of occurrences
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
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000",
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
        ]}
        """
        When we perform reschedule on events "#EVENT1._id#"
        """
        {
            "reason": "Extending number of occurrences",
            "dates": {
                "start": "2019-11-22T12:00:00.000Z",
                "end": "2019-11-22T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 4,
                    "endRepeatMode": "count"
                }
            },
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-12-13T12:00:00+0000",
                    "end": "2019-12-13T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 7 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"},
            {"operation": "reschedule", "event_id": "#EVENT1._id#", "update": {
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }},
            {"operation": "reschedule", "event_id": "#EVENT2._id#", "update": {
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }},
            {"operation": "reschedule", "event_id": "#EVENT3._id#", "update": {
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }},
            {"operation": "create", "event_id": "__any_value__", "update": {
                "dates": {
                    "start": "2019-12-13T12:00:00+0000",
                    "end": "2019-12-13T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }}
        ]}
        """
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }, {
            "event": "events:rescheduled",
            "extra": {
                "item": "#EVENT1._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    Scenario: Change occurrence day midway through the event series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
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
        When we perform reschedule on events "#EVENT3._id#"
        """
        {
            "dates": {
                "start": "2019-12-06T12:00:00.000Z",
                "end": "2019-12-06T14:00:00.000Z",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "WE",
                    "count": 5,
                    "endRepeatMode": "count"
                }
            },
            "update_method": "future"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 5 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "_id": "#EVENT2._id#",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "dates": {
                    "start": "2019-12-11T12:00:00+0000",
                    "end": "2019-12-11T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "dates": {
                    "start": "2019-12-18T12:00:00+0000",
                    "end": "2019-12-18T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "dates": {
                    "start": "2019-12-25T12:00:00+0000",
                    "end": "2019-12-25T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            }
        ]}
        """
        When we get "/events/#EVENT3._id#"
        Then we get error 404
        When we get "/events/#EVENT4._id#"
        Then we get error 404
        When we get "/events/#EVENT5._id#"
        Then we get error 404
