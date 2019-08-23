Feature: Events Post

    @auth
    @notification
    Scenario: Post all events in a series of recurring events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-21T23:00:00.000Z",
                "end": "2029-11-22T02:00:00.000Z",
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
        When we post to "/events/post"
        """
        {
            "event": "#EVENT2._id#",
            "etag": "#EVENT2._etag#",
            "pubstatus": "usable",
            "update_method": "all"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:posted:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "state": "scheduled",
                "pubstatus": "usable",
                "items": [{
                    "id": "#EVENT1._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT2._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT3._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT4._id#",
                    "etag": "__any_value__"
                }]
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 8 items
        """
        {"_items": [{
            "event_id": "#EVENT1._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT1._id#",
            "operation": "post",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "post",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "post",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "post",
            "update": {"state": "scheduled"}
        }]}
        """

    @auth
    @notification
    Scenario: Post all future events in a series of recurring events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-21T23:00:00.000Z",
                "end": "2029-11-22T02:00:00.000Z",
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
        When we post to "/events/post"
        """
        {
            "event": "#EVENT2._id#",
            "etag": "#EVENT2._etag#",
            "pubstatus": "usable",
            "update_method": "future"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:posted:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "state": "scheduled",
                "pubstatus": "usable",
                "items": [{
                    "id": "#EVENT2._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT3._id#",
                    "etag": "__any_value__"
                }, {
                    "id": "#EVENT4._id#",
                    "etag": "__any_value__"
                }]
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 7 items
        """
        {"_items": [{
            "event_id": "#EVENT1._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "post",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "post",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "post",
            "update": {"state": "scheduled"}
        }]}
        """

    @auth
    @notification
    Scenario: Post single event from a series of recurring events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-21T23:00:00.000Z",
                "end": "2029-11-22T02:00:00.000Z",
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
        When we post to "/events/post"
        """
        {
            "event": "#EVENT2._id#",
            "etag": "#EVENT2._etag#",
            "pubstatus": "usable",
            "update_method": "single"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:posted",
            "extra": {
                "item": "#EVENT2._id#",
                "state": "scheduled",
                "pubstatus": "usable"
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 5 items
        """
        {"_items": [{
            "event_id": "#EVENT1._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT2._id#",
            "operation": "post",
            "update": {"state": "scheduled"}
        }, {
            "event_id": "#EVENT3._id#",
            "operation": "create"
        }, {
            "event_id": "#EVENT4._id#",
            "operation": "create"
        }]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Unposting an event will delete associated assignment
        Given we have sessions "/sessions"
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "sign_off": "abc"}]
        """
        Given the "validators"
        """
        [{
            "schema": {},
            "type": "text",
            "act": "publish",
            "_id": "publish_text"
        },
        {
            "_id": "publish_composite",
            "act": "publish",
            "type": "composite",
            "schema": {}
        }]
        """
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        When we post to "/planning"
        """
        {
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-01-02",
            "event_item": "#events._id#"
        }
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type" : "text"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store coverage id in "coverageId" from coverage 0
        Then we store assignment id in "assignmentId" from coverage 0
        When we get "/assignments"
        Then we get list with 1 items
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        When we post to "assignments/link"
        """
        [{"assignment_id": "#assignmentId#", "item_id": "#archive._id#", "reassign": true}]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#assignmentId#"}
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "scheduled", "pubstatus": "usable" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "scheduled", "pubstatus": "usable" }
        """
        When we post to "/events/#events._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "killed" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "killed" }
        """
        When we get "/assignments"
        Then we get list with 0 items

    @auth
    @notification
    @vocabulary
    Scenario: Unposting an event will unpost associated planning item
        Given we have sessions "/sessions"
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "sign_off": "abc"}]
        """
        Given the "validators"
        """
        [{
            "schema": {},
            "type": "text",
            "act": "publish",
            "_id": "publish_text"
        },
        {
            "_id": "publish_composite",
            "act": "publish",
            "type": "composite",
            "schema": {}
        }]
        """
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        When we post to "/planning"
        """
        {
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-01-02",
            "event_item": "#events._id#"
        }
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type" : "text"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store coverage id in "coverageId" from coverage 0
        Then we store assignment id in "assignmentId" from coverage 0
        When we get "/assignments"
        Then we get list with 1 items
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        When we post to "assignments/link"
        """
        [{"assignment_id": "#assignmentId#", "item_id": "#archive._id#", "reassign": true}]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#assignmentId#"}
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "scheduled", "pubstatus": "usable" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "scheduled", "pubstatus": "usable" }
        """
        When we post to "/events/#events._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "killed" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "killed" }
        """


    @auth
    @notification
    @vocabulary
    Scenario: Unposting an event will send notifications if assignment deletion fails
        Given we have sessions "/sessions"
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "sign_off": "abc"}]
        """
        Given the "validators"
        """
        [{
            "schema": {},
            "type": "text",
            "act": "publish",
            "_id": "publish_text"
        },
        {
            "_id": "publish_composite",
            "act": "publish",
            "type": "composite",
            "schema": {}
        }]
        """
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        When we post to "/planning"
        """
        {
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-01-02",
            "event_item": "#events._id#"
        }
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type" : "text"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store coverage id in "coverageId" from coverage 0
        Then we store assignment id in "assignmentId" from coverage 0
        When we get "/assignments"
        Then we get list with 1 items
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        When we post to "assignments/link"
        """
        [{"assignment_id": "#assignmentId#", "item_id": "#archive._id#", "reassign": true}]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#assignmentId#"}
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "scheduled", "pubstatus": "usable" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "scheduled", "pubstatus": "usable" }
        """
        When we post to "/events/#events._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get OK response
        When we patch "/archive/#archive._id#"
        """
        {"lock_user": "#users._id#"}
        """
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "assignments:delete:fail",
            "extra": {
                "items": [
                  {
                    "slugline": "test slugline",
                    "type": "text"
                  }
                ],
                "session": "#SESSION_ID#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "killed" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "killed" }
        """
        When we get "/assignments"
        Then we get list with 1 items

    @auth
    @notification
    Scenario: Posting event after planning item is posted
        Given we have sessions "/sessions"
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "slugline": "TestEvent",
            "state": "draft",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "add_as_event",
            "lock_time": "#DATE#",
            "planning_date": "2016-01-02"
        }]
        """
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we reset notifications
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "_planning_item": "plan1",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        When we get "/planning/plan1"
        Then we get existing resource
        """
        {"event_item": "#events._id#"}
        """
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable",
            "update_method": "single"
        }
        """
        Then we get OK response
        When we get "published_planning"
        Then we get list with 3 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning._id#"
                },
                {
                    "item_id": "#planning._id#",
                    "published_item": {
                        "event_item": "#events._id#"
                    }
                },
                {
                    "item_id": "#events._id#",
                    "published_item": {
                        "plans": ["#planning._id#"]
                    }
                }
            ]
        }
        """

    @auth
    @notification
    @vocabulary
    Scenario: Unposting an event will spike planning items which in draft state
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        When we post to "/planning"
        """
        {
            "item_class": "item class value",
            "headline": "test headline1",
            "slugline": "test slugline",
            "planning_date": "2016-01-02",
            "event_item": "#events._id#"
        }
        """
        Then we get OK response
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "scheduled", "pubstatus": "usable" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "draft" }
        """
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "killed" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "spiked" }
        """

    @auth
    @notification
    @vocabulary
    Scenario: Unposting an event will spike never posted planning items which in postpone state
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        When we post to "/planning"
        """
        {
            "item_class": "item class value",
            "headline": "test headline1",
            "slugline": "test slugline",
            "planning_date": "2016-01-02",
            "event_item": "#events._id#"
        }
        """
        Then we get OK response
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "scheduled", "pubstatus": "usable" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "draft" }
        """
        When we post to "/events/#events._id#/lock" with success
        """
        {"lock_action": "postpone"}
        """
        When we perform postpone on events "#events._id#"
        """
        {"reason": "Not happening anymore!"}
        """
        Then we get OK response
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "postponed" }
        """
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "killed" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "spiked" }
        """

    @auth
    @notification
    @vocabulary
    Scenario: Unposting an event will spike never posted planning items which in cancel state
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        When we post to "/planning"
        """
        {
            "item_class": "item class value",
            "headline": "test headline1",
            "slugline": "test slugline",
            "planning_date": "2016-01-02",
            "event_item": "#events._id#"
        }
        """
        Then we get OK response
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "scheduled", "pubstatus": "usable" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "draft" }
        """
        When we post to "/events/#events._id#/lock" with success
        """
        {"lock_action": "cancel"}
        """
        When we perform cancel on events "#events._id#"
        """
        {"reason": "Not happening anymore!"}
        """
        Then we get OK response
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "cancelled" }
        """
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        When we get "events/#events._id#"
        Then we get existing resource
        """
        { "state": "killed" }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        { "state": "spiked" }
        """

    @auth
    @notification
    @vocabulary
    Scenario: When a postponed multiday event is scheduled actioned_date is poppped
        Given we have sessions "/sessions"
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-26T14:00:00.000Z",
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
            "lock_session": null,
            "actioned_date": "__now__"
        }]}
        """
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get a list with 1 items
        """
        {"_items": [{
            "_id": "event1",
            "state": "scheduled",
            "actioned_date": "__none__"
        }]}
        """

    @auth
    @notification
    Scenario: actioned_date of completed event is not popped when posted
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-22T01:00:00.000Z",
                "end": "2029-11-22T02:00:00.000Z",
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
        When we patch "/events/#EVENT3._id#"
        """
        {
            "lock_action": "mark_completed",
            "actioned_date": "2029-11-24T02:00:00.000Z",
            "completed": true
        }
        """
        Then we get OK response
        When we get "/events/#EVENT3._id#"
        Then we get existing resource
        """
        {
            "_id": "#EVENT3._id#",
            "actioned_date": "2029-11-24T02:00:00+0000",
            "completed": true
        }
        """
        When we post to "/events/post"
        """
        {
            "event": "#EVENT3._id#",
            "etag": "#EVENT3._etag#",
            "pubstatus": "usable",
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events/#EVENT3._id#"
        Then we get existing resource
        """
        {
            "_id": "#EVENT3._id#",
            "actioned_date": "2029-11-24T02:00:00+0000",
            "completed": true
        }
        """