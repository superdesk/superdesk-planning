Feature: Events Spike
    @auth
    Scenario: Event state defaults to draft
        When we post to "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "name": "TestEvent",
            "state": "draft"
        }
        """

    @auth
    @notification
    Scenario: Spike an Event
        Given "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        When we spike events "#events._id#"
        Then we get OK response
        Then we store "SPIKED" from patch
        And we get notifications
        """
        [{
            "event": "events:spiked",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#",
                "spiked_items": [{
                    "id": "#events._id#",
                    "etag": "#SPIKED._etag#",
                    "revert_state": "draft"
                }]
            }
        }]
        """
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "name": "TestEvent",
            "state": "spiked",
            "_etag": "#SPIKED._etag#"
        }
        """
        When we get "/events_history?where=event_id==%22#events._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_id": "#events._id#",
            "operation": "spiked",
            "update": {"state" : "spiked"}
        }]}
        """

    @auth
    Scenario: Event can be spiked and unspiked only by user having privileges
        Given "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_event_spike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike events "#events._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_event_spike": 1,
                "planning_event_unspike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike events "#events._id#"
        Then we get OK response
        When we unspike events "#events._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_event_unspike": 1,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we unspike events "#events._id#"
        Then we get OK response

    @auth
    Scenario: Spiking an Event fails if an associated Planning items is locked
        Given "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-01",
                "end": "2017-01-01"
            }
        }]
        """
        Given "planning"
        """
        [{
            "slugline": "TestPlan 1",
            "event_item": "#events._id#",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "123"
        }, {
            "slugline": "TestPlan 2",
            "event_item": "#events._id#"
        }]
        """
        When we get "/planning"
        Then we get list with 2 items
        """
            {"_items": [{
                "slugline": "TestPlan 1",
                "event_item": "#events._id#",
                "state": "draft",
                "lock_user": "#CONTEXT_USER_ID#",
                "lock_session": "123"
            }, {
                "slugline": "TestPlan 2",
                "event_item": "#events._id#",
                "state": "draft"
            }]}
        """
        When we spike events "#events._id#"
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "403: Spike failed. One or more related planning items are locked."
            }
        }
        """

    @auth
    @notification
    Scenario: Spiking a locked event unlocks the event after spiking it
        Given "events"
        """
        [{
            "name": "TestEvent",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "session123"
        }]
        """
        When we spike events "#events._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:spiked",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "name": "TestEvent",
            "state": "spiked",
            "lock_user": null,
            "lock_session": null
        }
        """
        When we get "/events_history?where=event_id==%22#events._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "event_id": "#events._id#",
            "operation": "spiked",
            "update": {"state" : "spiked"}
        }]}
        """

    @auth
    Scenario: Spiking an Event fails if an Event or Planning item in the series is locked
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
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
        When we post to "/planning"
        """
        [{
            "slugline": "Friday Club",
            "headline": "First Meeting",
            "event_item": "#EVENT2._id#"
        }]
        """
        Then we get OK response
        When we post to "/events/#EVENT3._id#/lock"
        """
        {"lock_action": "edit"}
        """
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "403: Spike failed. An event in the series is locked."
            }
        }
        """
        When we post to "/events/#EVENT3._id#/unlock"
        """
        {}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "403: Spike failed. A related planning item is locked."
            }
        }
        """
        When we post to "/planning/#planning._id#/unlock"
        """
        {}
        """
        Then we get OK response
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response

    @auth
    Scenario: Spiking a series of Events only spiked Events not in use
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        And we store "EVENT4" with 4 item
        When we post to "/planning"
        """
        [{
            "slugline": "Friday Club",
            "headline": "First Meeting",
            "event_item": "#EVENT2._id#"
        }]
        """
        When we post to "/events/publish"
        """
        {"event": "#EVENT4._id#", "etag": "#EVENT4._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "state": "spiked",
                "revert_state": "draft"
            },
            {
                "_id": "#EVENT2._id#",
                "state": "draft"
            },
            {
                "_id": "#EVENT3._id#",
                "state": "spiked",
                "revert_state": "draft"
            },
            {
                "_id": "#EVENT4._id#",
                "state": "scheduled"
            }
        ]}
        """

    @auth
    Scenario: Event can be spiked only when in certain states
        Given "events"
        """
        [{
            "_id": "event1", "guid": "event1",
            "name": "Public Event",
            "dates": {"start": "2099-02-12", "end": "2099-03-12"},
            "state": "scheduled",
            "pubstatus": "usable"
        }, {
            "_id": "event2", "guid": "event2",
            "name": "Planning Event",
            "dates": {"start": "2099-02-12", "end": "2099-03-12"}
        }, {
            "_id": "event3", "guid": "event3",
            "name": "Reschedule From Event",
            "dates": {"start": "2099-02-12", "end": "2099-03-12"},
            "state": "draft",
            "reschedule_from": "event7"
        }, {
            "_id": "event4", "guid": "event4",
            "name": "Reschedule To Event",
            "dates": {"start": "2099-02-12", "end": "2099-03-12"},
            "state": "rescheduled"
        }, {
            "_id": "event5", "guid": "event5",
            "name": "Spiked Event",
            "dates": {"start": "2099-02-12", "end": "2099-03-12"},
            "state": "spiked"
        }]
        """
        Given "planning"
        """
        [{
            "_id": "plan1", "guid": "plan1",
            "slugline": "TestPlan 1",
            "event_item": "event2",
            "state": "draft"
        }]
        """
        When we spike events "event1"
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: Spike failed. Public Events cannot be spiked."}}
        """
        When we spike events "event2"
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: Spike failed. Event has an associated Planning item."}}
        """
        When we spike events "event3"
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: Spike failed. Rescheduled Events cannot be spiked."}}
        """
        When we spike events "event4"
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: Spike failed. Rescheduled Events cannot be spiked."}}
        """
        When we spike events "event5"
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: Spike failed. Event is already spiked."}}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Spiking a series of recurring Events does not spike certain Events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-10-08T23:00:00.000Z",
                "end": "2099-10-09T02:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 7,
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
        Then we store "EVENT6" with 6 item
        Then we store "EVENT7" with 7 item
        When we post to "/events/publish" with success
        """
        {
            "event": "#EVENT2._id#",
            "etag": "#EVENT2._etag#",
            "pubstatus": "usable",
            "update_method": "single"
        }
        """
        When we post to "/planning" with success
        """
        [{
            "slugline": "Friday Club",
            "event_item": "#EVENT3._id#"
        }]
        """
        When we post to "/planning" with success
        """
        [{
            "slugline": "Friday Club",
            "event_item": "#EVENT4._id#"
        }]
        """
        When we post to "/events/#EVENT4._id#/lock" with success
        """
        {"lock_action": "reschedule"}
        """
        When we perform reschedule on events "#EVENT4._id#"
        """
        {
            "reason": "Moving to the Thursday",
            "dates": {
                "start": "2099-10-29T01:00:00.000Z",
                "end": "2099-10-29T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        Then we store "RESCHEDULED" from last rescheduled item
        When we spike events "#EVENT5._id#"
        Then we get OK response
        When we post to "/planning" with success
        """
        [{
            "slugline": "Friday Club",
            "event_item": "#EVENT6._id#"
        }]
        """
        When we post to "/events/#EVENT6._id#/lock" with success
        """
        {"lock_action": "cancel"}
        """
        When we perform cancel on events "#EVENT6._id#"
        Then we get OK response
        When we reset notifications
        When we spike events "#EVENT1._id#"
        """
        {"update_method": "all"}
        """
        Then we get notifications
        """
        [{
            "event": "events:spiked",
            "extra": {
                "item": "#EVENT1._id#",
                "user": "#CONTEXT_USER_ID#",
                "spiked_items": [{
                    "id": "#EVENT1._id#",
                    "etag": "__any_value__",
                    "revert_state": "draft"
                }, {
                    "id": "#EVENT7._id#",
                    "etag": "__any_value__",
                    "revert_state": "draft"
                }]
            }
        }]
        """
        When we get "/events"
        Then we get list with 8 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "state": "spiked",
            "revert_state": "draft",
            "dates": {
                "start": "2099-10-08T23:00:00+0000",
                "end": "2099-10-09T02:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 7,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT2._id#",
            "state": "scheduled",
            "pubstatus": "usable",
            "dates": {
                "start": "2099-10-15T23:00:00+0000",
                "end": "2099-10-16T02:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 7,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT3._id#",
            "state": "draft",
            "dates": {
                "start": "2099-10-22T23:00:00+0000",
                "end": "2099-10-23T02:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 7,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT4._id#",
            "state": "rescheduled",
            "reschedule_to": "#RESCHEDULED.id#",
            "dates": {
                "start": "2099-10-29T23:00:00+0000",
                "end": "2099-10-30T02:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 7,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#RESCHEDULED.id#",
            "state": "draft",
            "reschedule_from": "#EVENT4._id#",
            "dates": {
                "start": "2099-10-29T01:00:00+0000",
                "end": "2099-10-29T04:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "#EVENT5._id#",
            "state": "spiked",
            "revert_state": "draft",
            "dates": {
                "start": "2099-11-05T23:00:00+0000",
                "end": "2099-11-06T02:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 7,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT6._id#",
            "state": "cancelled",
            "dates": {
                "start": "2099-11-12T23:00:00+0000",
                "end": "2099-11-13T02:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 7,
                    "endRepeatMode": "count"
                }
            }
        }, {
            "_id": "#EVENT7._id#",
            "state": "spiked",
            "revert_state": "draft",
            "dates": {
                "start": "2099-11-19T23:00:00+0000",
                "end": "2099-11-20T02:00:00+0000",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 7,
                    "endRepeatMode": "count"
                }
            }
        }]}
        """
