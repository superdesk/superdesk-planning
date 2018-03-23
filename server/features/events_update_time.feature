Feature: Events Update Time

    @auth
    @notification
    Scenario: Update time of single event
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
            },
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "update_time",
            "lock_time": "#DATE#"
        }]
        """
        When we reset notifications
        When we perform update_time on events "event1"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:unlock",
            "extra": {"item": "event1", "user": "#CONTEXT_USER_ID#"}
        }, {
            "event": "events:update_time",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "guid": "event1",
            "dates": {
                "start": "2029-11-21T02:00:00+0000",
                "end": "2029-11-21T04:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "lock_user": null,
            "lock_session": null,
            "lock_action": null,
            "lock_time": null
        }
        """

    @auth
    Scenario: Event must be locked to update the time
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
            "lock_action": "update_time",
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
            "lock_action": "update_time",
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
        When we perform update_time on events "event1"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event must be locked"}, "_status": "ERR"}
        """
        When we perform update_time on events "event2"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event is locked by you in another session"}, "_status": "ERR"}
        """
        When we perform update_time on events "event3"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event is locked by another user"}, "_status": "ERR"}
        """
        When we perform update_time on events "event4"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The lock must be for the `update time` action"}, "_status": "ERR"}
        """

    @auth
    @notification
    Scenario: Update time of a all events in a series of recurring events
        Given we have sessions "/sessions"
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
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
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_time"}
        """
        When we reset notifications
        When we perform update_time on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-22T02:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "update_method": "all"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:unlock",
            "extra": {"item": "#EVENT2._id#", "user": "#CONTEXT_USER_ID#"}
        }, {
            "event": "events:update_time:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "user": "#CONTEXT_USER_ID#",
                "session": "#SESSION_ID#",
                "recurrence_id": "#EVENT2.recurrence_id#"
            }
        }]
        """
        When we get "events"
        Then we get list with 4 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "dates": {
                "start": "2029-11-21T02:00:00+0000",
                "end": "2029-11-21T04:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT2._id#",
            "dates": {
                "start": "2029-11-22T02:00:00+0000",
                "end": "2029-11-22T04:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT3._id#",
            "dates": {
                "start": "2029-11-23T02:00:00+0000",
                "end": "2029-11-23T04:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT4._id#",
            "dates": {
                "start": "2029-11-24T02:00:00+0000",
                "end": "2029-11-24T04:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]}
        """

    @auth
    @notification
    Scenario: Update time of a all future events in a series of recurring events
        Given we have sessions "/sessions"
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
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
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_time"}
        """
        When we reset notifications
        When we perform update_time on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-22T02:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "update_method": "future"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:unlock",
            "extra": {"item": "#EVENT2._id#", "user": "#CONTEXT_USER_ID#"}
        }, {
            "event": "events:update_time:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "user": "#CONTEXT_USER_ID#",
                "session": "#SESSION_ID#",
                "recurrence_id": "#EVENT2.recurrence_id#"
            }
        }]
        """
        When we get "events"
        Then we get list with 4 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT2._id#",
            "dates": {
                "start": "2029-11-22T02:00:00+0000",
                "end": "2029-11-22T04:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT3._id#",
            "dates": {
                "start": "2029-11-23T02:00:00+0000",
                "end": "2029-11-23T04:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT4._id#",
            "dates": {
                "start": "2029-11-24T02:00:00+0000",
                "end": "2029-11-24T04:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]}
        """

    @auth
    @notification
    Scenario: Update time of a single event in a series of recurring events
        Given we have sessions "/sessions"
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
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
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_time"}
        """
        When we reset notifications
        When we perform update_time on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-22T02:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "update_method": "single"
        }
        """
        Then we get OK response

        And we get notifications
        """
        [{
            "event": "events:unlock",
            "extra": {"item": "#EVENT2._id#", "user": "#CONTEXT_USER_ID#"}
        }, {
            "event": "events:update_time:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "user": "#CONTEXT_USER_ID#",
                "session": "#SESSION_ID#",
                "recurrence_id": "#EVENT2.recurrence_id#"
            }
        }]
        """
        When we get "events"
        Then we get list with 4 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT2._id#",
            "dates": {
                "start": "2029-11-22T02:00:00+0000",
                "end": "2029-11-22T04:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT3._id#",
            "dates": {
                "start": "2029-11-23T12:00:00+0000",
                "end": "2029-11-23T14:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT4._id#",
            "dates": {
                "start": "2029-11-24T12:00:00+0000",
                "end": "2029-11-24T14:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]}
        """

    @auth
    @notification
    Scenario: Update time on a series with a 'rescheduled' event
        Given we have sessions "/sessions"
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-18T22:00:00.000Z",
                "end": "2029-11-19T02:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count",
                    "byday": "MO"
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
        When we post to "/planning" with success
        """
        [{
            "event_item": "#EVENT3._id#",
            "slugline": "Friday Club"
        }]
        """
        When we post to "/events/#EVENT3._id#/lock" with success
        """
        {"lock_action": "reschedule"}
        """
        When we perform reschedule on events "#EVENT3._id#"
        """
        {
            "reason": "Changed to the next day!",
            "dates": {
                "start": "2029-12-04T01:00:00.000Z",
                "end": "2029-12-04T05:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        Then we store "DUPLICATE" from last rescheduled item
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_time"}
        """
        When we perform update_time on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-26T03:00:00.000Z",
                "end": "2029-11-26T09:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "events"
        Then we get list with 5 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-11-19T03:00:00+0000",
                "end": "2029-11-19T09:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-11-26T03:00:00+0000",
                "end": "2029-11-26T09:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "rescheduled",
            "dates": {
                "start": "2029-12-02T22:00:00+0000",
                "end": "2029-12-03T02:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#DUPLICATE.id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-12-04T03:00:00+0000",
                "end": "2029-12-04T09:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT4._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-12-10T03:00:00+0000",
                "end": "2029-12-10T09:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }]}
        """

    @auth
    @notification
    Scenario: Update time on a series with a 'postponed' event
        Given we have sessions "/sessions"
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-19T03:00:00.000Z",
                "end": "2029-11-19T09:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count",
                    "byday": "MO"
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
        When we post to "/planning" with success
        """
        [{
            "event_item": "#EVENT3._id#",
            "slugline": "Friday Club"
        }]
        """
        When we post to "/events/#EVENT3._id#/lock" with success
        """
        {"lock_action": "postpone"}
        """
        When we perform postpone on events "#EVENT3._id#"
        Then we get OK response
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_time"}
        """
        When we perform update_time on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-25T22:00:00.000Z",
                "end": "2029-11-26T02:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "events"
        Then we get list with 4 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-11-18T22:00:00+0000",
                "end": "2029-11-19T02:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-11-25T22:00:00+0000",
                "end": "2029-11-26T02:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "postponed",
            "dates": {
                "start": "2029-12-03T03:00:00+0000",
                "end": "2029-12-03T09:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT4._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-12-09T22:00:00+0000",
                "end": "2029-12-10T02:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Update time on a series with a 'cancelled' event
        Given we have sessions "/sessions"
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-19T03:00:00.000Z",
                "end": "2029-11-19T09:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count",
                    "byday": "MO"
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
        When we post to "/planning" with success
        """
        [{
            "event_item": "#EVENT3._id#",
            "slugline": "Friday Club"
        }]
        """
        When we post to "/events/#EVENT3._id#/lock" with success
        """
        {"lock_action": "cancel"}
        """
        When we perform cancel on events "#EVENT3._id#"
        Then we get OK response
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_time"}
        """
        When we perform update_time on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-25T22:00:00.000Z",
                "end": "2029-11-25T23:30:00.000Z",
                "tz": "Australia/Sydney"
            },
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "events"
        Then we get list with 4 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-11-18T22:00:00+0000",
                "end": "2029-11-18T23:30:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-11-25T22:00:00+0000",
                "end": "2029-11-25T23:30:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "cancelled",
            "dates": {
                "start": "2029-12-03T03:00:00+0000",
                "end": "2029-12-03T09:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT4._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "state": "draft",
            "dates": {
                "start": "2029-12-09T22:00:00+0000",
                "end": "2029-12-09T23:30:00+0000",
                "tz": "Australia/Sydney"
            }
        }]}
        """


    @auth
    @notification
    Scenario: Published event gets update after updating time
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
            },
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "update_time",
            "lock_time": "#DATE#",
            "state": "scheduled",
            "pubstatus": "usable"
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
        When we reset notifications
        When we perform update_time on events "event1"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:unlock",
            "extra": {"item": "event1", "user": "#CONTEXT_USER_ID#"}
        }, {
            "event": "events:update_time",
            "extra": {
                "item": "event1",
                "user": "#CONTEXT_USER_ID#"
            }
        }, {
            "event": "events:published",
            "extra": {
                "item": "event1"
            }
        }]
        """
        When we get "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "guid": "event1",
            "dates": {
                "start": "2029-11-21T02:00:00+0000",
                "end": "2029-11-21T04:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "lock_user": null,
            "lock_session": null,
            "lock_action": null,
            "lock_time": null,
            "state": "scheduled",
            "pubstatus": "usable"
        }
        """
        When we get "publish_queue"
        Then we get list with 1 items