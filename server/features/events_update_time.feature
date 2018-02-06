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
