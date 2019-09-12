Feature: Events

    @auth
    Scenario: Empty events list
        Given empty "events"
        When we get "/events"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Create new events item
        Given empty "users"
        Given empty "locations"
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        And we reset notifications
        Then we get existing resource
        """
        {"_id": "#users._id#", "invisible_stages": []}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "relationships":{
                    "broader": "broader value",
                    "narrower": "narrower value",
                    "related": "related value"
                },
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "location": [{"qcode": "test qcaode", "name": "test name"}],
                "event_contact_info": ["#contacts._id#"]
            }
        ]
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
        When we get "/events"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "original_creator": "#CONTEXT_USER_ID#",
                "type": "event",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "location": [{"qcode": "test qcaode", "name": "test name", "formatted_address": ""}],
                "firstcreated": "__now__",
                "versioncreated": "__now__"
            }]}
        """
        When we get "/events?sort=[("dates.start",1)]&source={"query":{"range":{"dates.start":{"lte":"2015-01-01T00:00:00.000Z"}}}}"
        Then we get list with 0 items
        When we get "/events?sort=[("dates.start",1)]&source={"query":{"range":{"dates.start":{"gte":"2016-01-02T00:00:00.000Z"}}}}"
        Then we get list with 1 items
        When we get "/events_history"
        Then we get a list with 1 items
        """
            {"_items": [{"operation": "create", "event_id": "#events._id#", "update": {"name": "event 123"}}]}
        """

    @auth
    @notification
    Scenario: Prevent to save an event with an existing unique_name
    When we post to "/events" with success
    """
    [
        {
            "unique_name": "JO",
            "name": "JO",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-18"
            }
        }
    ]
    """
    And we post to "/events"
    """
    [
        {
            "unique_name": "JO",
            "name": "JO 2022",
            "dates": {
                "start": "2016-01-10",
                "end": "2016-01-18"
            }
        }
    ]
    """
    Then we get error 400

    @auth
    Scenario: Event can be created only by user having privileges
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_event_management": 0, "users": 1}}
        """
        Then we get OK response
        When we post to "events"
        """
        [{
            "guid": "123",
            "unique_id": "123",
            "name": "event 123",
            "definition_short": "short value",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        Then we get error 403
        When we setup test user
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_event_management": 1, "users": 1}}
        """
        Then we get OK response
        When we post to "events"
        """
        [{
            "guid": "123",
            "unique_id": "123",
            "name": "event 123",
            "definition_short": "short value",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        Then we get OK response

    @auth
    @notification
    Scenario: Event can be modified only by user having privileges
        When we post to "events" with success
        """
        [{
            "guid": "123",
            "unique_id": "123",
            "name": "event 123",
            "definition_short": "short value",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        Then we store "eventId" with value "#events._id#" to context
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_event_management": 0, "users": 1}}
        """
        Then we get OK response
        When we patch "/events/#eventId#"
        """
        {"name": "New Event"}
        """
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_event_management": 1, "users": 1}}
        """
        Then we get OK response
        When we patch "/events/#eventId#"
        """
        {"name": "New Event"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated",
            "extra": {
                "item": "#eventId#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Track post history for event
        Given empty "users"
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "relationships":{
                    "broader": "broader value",
                    "narrower": "narrower value",
                    "related": "related value"
                },
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "event_contact_info": ["#contacts._id#"]
            }
        ]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:posted",
            "extra": {
                "item": "#events._id#",
                "state": "scheduled",
                "pubstatus": "usable"
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 2 items
        """
            {"_items": [{
                "event_id": "#events._id#",
                "operation": "create"
                },
                {
                "event_id": "#events._id#",
                "operation": "post",
                "update": {"state": "scheduled"}
                }
            ]}
        """
        When we post to "/events/post"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "cancelled"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:unposted",
            "extra": {
                "item": "#events._id#",
                "state": "killed",
                "pubstatus": "cancelled"
            }
        }]
        """
        When we get "/events_history"
        Then we get a list with 3 items
        """
            {"_items": [{
                "event_id": "#events._id#",
                "operation": "create"
                },
                {
                "event_id": "#events._id#",
                "operation": "post",
                "update": {"state": "scheduled"}
                },
                {
                "event_id": "#events._id#",
                "operation": "post",
                "update": {"pubstatus": "cancelled"}
                }
            ]}
        """

    @auth
    Scenario: Duplicate an event
        Given "vocabularies"
        """
        [{
            "_id": "eventoccurstatus",
                    "display_name": "Event Occurence Status",
                    "type": "manageable",
                    "unique_field": "qcode",
                    "items": [
                        {"is_active": true, "qcode": "eocstat:eos0", "name": "Unplanned event"},
                        {"is_active": true, "qcode": "eocstat:eos1", "name": "Planned, occurence planned only"},
                        {"is_active": true, "qcode": "eocstat:eos2", "name": "Planned, occurence highly uncertain"},
                        {"is_active": true, "qcode": "eocstat:eos3", "name": "Planned, May occur"},
                        {"is_active": true, "qcode": "eocstat:eos4", "name": "Planned, occurence highly likely"},
                        {"is_active": true, "qcode": "eocstat:eos5", "name": "Planned, occurs certainly"},
                        {"is_active": true, "qcode": "eocstat:eos6", "name": "Planned, then cancelled"}
                    ]
        }]
        """
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        Given empty "users"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "relationships":{
                    "broader": "broader value",
                    "narrower": "narrower value",
                    "related": "related value"
                },
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "event_contact_info": ["#contacts._id#"]
            }
        ]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        When we post to "/events"
        """
        [{
            "name": "event 123",
            "state": "draft",
            "type": "event",
            "occur_status": {"qcode": "eocstat:eos5"},
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "duplicate_from": "123"
        }]
        """
        Then we get OK response
        When we get "/events/123"
        Then we get existing resource
        """
        {
            "_id": "123",
            "name": "event 123",
            "type": "event",
            "state": "scheduled",
            "original_creator": "#CONTEXT_USER_ID#",
            "duplicate_to": ["#events._id#"]
        }
        """
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "name": "event 123",
            "state": "draft",
            "type": "event",
            "original_creator": "#CONTEXT_USER_ID#",
            "occur_status": {"qcode": "eocstat:eos5"},
            "duplicate_from": "123"
        }
        """
        When we get "/events_history"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "operation": "create",
                "event_id": "123"
            },
            {
                "operation": "post",
                "update": { "state" : "scheduled", "pubstatus": "usable" }
            },
            {
                "operation": "duplicate",
                "update": { "duplicate_id" : "#events._id#"}
            },
            {
                "operation": "duplicate_from",
                "update": { "duplicate_id" : "123"}
            }
        ]}
        """

    @auth
    Scenario: Duplicating an expired Event will remove the expired flag
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "Test Event",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "state": "draft",
            "expired": true
        }]
        """
        When we post to "/events"
        """
        [{
            "name": "Test Event",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "state": "draft",
            "expired": true
        }]
        """
        Then we get OK response
        And we get existing resource
        """
        {
            "name": "Test Event",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "state": "draft",
            "expired": "__no_value__"
        }
        """

    @auth
    @notification
    Scenario: Posted event modified will re-post the event
        When we post to "events" with success
        """
        [{
            "guid": "123",
            "unique_id": "123",
            "name": "event 123",
            "definition_short": "short value",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            }
        }]
        """
        When we post to "/events/post"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {"name": "New Event"}
        """
        Then we get OK response
        When we get "/events_history"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "operation": "create",
                "event_id": "#events._id#"
            },
            {
                "operation": "post",
                "event_id": "#events._id#"
            },
            {
                "operation": "edited",
                "update": { "name" : "New Event"}
            },
            {
                "operation": "post",
                "event_id": "#events._id#"
            }
        ]}
        """

    @auth
    Scenario: Duplicating posted event will not repost it
        Given "vocabularies"
        """
        [{
            "_id": "eventoccurstatus",
                    "display_name": "Event Occurence Status",
                    "type": "manageable",
                    "unique_field": "qcode",
                    "items": [
                        {"is_active": true, "qcode": "eocstat:eos0", "name": "Unplanned event"},
                        {"is_active": true, "qcode": "eocstat:eos1", "name": "Planned, occurence planned only"},
                        {"is_active": true, "qcode": "eocstat:eos2", "name": "Planned, occurence highly uncertain"},
                        {"is_active": true, "qcode": "eocstat:eos3", "name": "Planned, May occur"},
                        {"is_active": true, "qcode": "eocstat:eos4", "name": "Planned, occurence highly likely"},
                        {"is_active": true, "qcode": "eocstat:eos5", "name": "Planned, occurs certainly"},
                        {"is_active": true, "qcode": "eocstat:eos6", "name": "Planned, then cancelled"}
                    ]
        }]
        """
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        Given empty "users"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "relationships":{
                    "broader": "broader value",
                    "narrower": "narrower value",
                    "related": "related value"
                },
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "event_contact_info": ["#contacts._id#"]
            }
        ]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {"event": "#events._id#", "etag": "#events._etag#", "pubstatus": "usable"}
        """
        When we post to "/events"
        """
        [{
            "name": "event 123",
            "state": "draft",
            "occur_status": {"qcode": "eocstat:eos5"},
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "duplicate_from": "123"
        }]
        """
        Then we get OK response
        When we get "/events/123"
        Then we get existing resource
        """
        {
            "_id": "123",
            "name": "event 123",
            "state": "scheduled",
            "duplicate_to": ["#events._id#"]
        }
        """
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "name": "event 123",
            "state": "draft",
            "occur_status": {"qcode": "eocstat:eos5"},
            "duplicate_from": "123"
        }
        """
        When we get "/events_history"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "operation": "create",
                "event_id": "123"
            },
            {
                "operation": "post",
                "update": { "state" : "scheduled", "pubstatus": "usable" }
            },
            {
                "operation": "duplicate",
                "update": { "duplicate_id" : "#events._id#"}
            },
            {
                "operation": "duplicate_from",
                "update": { "duplicate_id" : "123"}
            }
        ]}
        """

    @auth
    @notification
    Scenario: Links the new Event to a Planning Item
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
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {"item": "plan1"}
        }, {
            "event": "events:created",
            "extra": {"item": "#events._id#"}
        }]
        """
        When we get "/events_history"
        Then we get a list with 1 items
        """
            {
                "_items": [{
                    "operation": "created_from_planning",
                    "event_id": "#events._id#",
                    "update": {
                        "name": "TestEvent",
                        "created_from_planning": "#planning._id#"
                    }
                }]
            }
        """
        When we get "/planning_history"
        Then we get a list with 1 items
        """
            {
                "_items": [{
                    "operation": "create_event",
                    "planning_id": "#planning._id#",
                    "update": {
                        "event_item": "#events._id#"
                    }
                }]
            }
        """

    @auth
    Scenario: Fails to link a new Event to a Planning Item if another use holds the Planning lock
        Given we have sessions "/sessions"
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "slugline": "TestEvent",
            "state": "draft",
            "lock_user": "ident2",
            "lock_session": "#SESSION_ID#",
            "lock_action": "add_as_event",
            "lock_time": "#DATE#",
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
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 403
        """
        {"_message": "The item was locked by another user"}
        """

    @auth

    Scenario: Deletes file if no longer used by any event during a patch call
        Given we have sessions "/sessions"
        When we upload a file "bike.jpg" to "/events_files"
        Then we get an event file reference
        When we get "events_files/"
        Then we get list with 1 items
        """
        {"_items": [{ "_id": "#events_files._id#" }]}
        """
        When we post to "events"
        """
        {
            "name": "Whatever",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": ["#events_files._id#"]

        }
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": ["#events_files._id#"]
        }
        """
        When we patch "/events/#events._id#"
        """
        { "files": [] }
        """
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": []
        }
        """
        When we get "events_files/"
        Then we get list with 0 items
        """
        {"_items": []}
        """


    @auth
    Scenario: Does not delete file if used by other events
        Given we have sessions "/sessions"
        When we upload a file "bike.jpg" to "/events_files"
        Then we get an event file reference
        When we get "events_files/"
        Then we get list with 1 items
        """
        {"_items": [{ "_id": "#events_files._id#" }]}
        """
        When we post to "events"
        """
        {
            "guid": "123",
            "name": "Whatever",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": ["#events_files._id#"]

        }
        """
        Then we get OK response
        When we get "/events/123"
        Then we get existing resource
        """
        {
            "guid": "123",
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": ["#events_files._id#"]
        }
        """
        When we post to "events"
        """
        {
            "name": "Whatever",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": ["#events_files._id#"],
            "duplicate_from": "123"
        }
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": ["#events_files._id#"],
            "duplicate_from": "123"
        }
        """
        When we patch "/events/#events._id#"
        """
        { "files": [] }
        """
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "2018-06-01T05:19:02+0000",
            "files": []
        }
        """
        When we get "events_files/"
        Then we get list with 1 items
        """
        {"_items": [{ "_id": "#events_files._id#" }]}
        """

    @auth
    Scenario: Create new event fails if max duration is greater than 7 days
        Given config update
        """
        {"MAX_MULTI_DAY_EVENT_DURATION": 7}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "dates": {
                    "start": "2099-01-02",
                    "end": "2099-01-12"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}]
            }
        ]
        """
        Then we get error 400
        """
        {"_message": "Event duration is greater than 7 days.", "_status": "ERR"}
        """

    @auth
    Scenario: Create new event fails start date less than end date
        Given config update
        """
        {"MAX_MULTI_DAY_EVENT_DURATION": 7}
        """
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "dates": {
                    "start": "2099-01-12",
                    "end": "2099-01-10"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}]
            }
        ]
        """
        Then we get error 400
        """
        {"_message": "END TIME should be after START TIME", "_status": "ERR"}
        """

    @auth
    Scenario: Duplicate ingested event
        Given "events"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "dates": {
                    "start": "2099-01-01",
                    "end": "2099-01-02"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}]
            }
        ]
        """
        When we post to "events"
        """
        {
            "name": "duplicate 123",
            "duplicate_from": "123",
            "original_creator": "",
            "dates": {
                    "start": "2099-01-01",
                    "end": "2099-01-02"
            }
        }
        """
        Then we get OK response


    @auth
    @notification
    Scenario: Validates dates
        When we post to "/events"
        """
        [
            {
                "guid": "123",
                "unique_id": "123",
                "unique_name": "123 name",
                "name": "event 123",
                "slugline": "event-123",
                "definition_short": "short value",
                "definition_long": "long value",
                "dates": { }
            }
        ]
        """
        Then we get error 400
        """
        {"_message": "Event START DATE and END DATE are mandatory."}
        """

    @auth
    @notification
    @vocabularies
    Scenario: Marking an event as complete will cancel related coverages
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60}]
        """
        And "vocabularies"
        """
        [{
            "_id": "newscoveragestatus",
            "display_name": "News Coverage Status",
            "type": "manageable",
            "unique_field": "qcode",
            "items": [
                {"is_active": true, "qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                {"is_active": true, "qcode": "ncostat:notdec", "name": "coverage not decided yet",
                    "label": "On merit"},
                {"is_active": true, "qcode": "ncostat:notint", "name": "coverage not intended",
                    "label": "Not planned"},
                {"is_active": true, "qcode": "ncostat:onreq", "name": "coverage upon request",
                    "label": "On request"}
            ]
        }, {
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
        }]
        """
        When we post to "/planning"
        """
        [{
            "slugline": "test slugline",
            "planning_date": "2029-11-21T12:00:00.000Z"
        }]
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
                    "g2_content_type": "text"
                },
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
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "draft"
            }
        }
        """
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "_planning_item": "#planning._id#",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"event_item": "#events._id#"}
        """
        When we post to "/events/#events._id#/lock"
        """
        {
            "lock_action": "mark_completed"
        }
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {
            "completed": true,
            "actioned_date": "2029-11-21T12:00:00.000Z"
        }
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "completed": true,
            "actioned_date": "2029-11-21T12:00:00+0000"
        }
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "slugline": "test slugline",
            "planning_date": "2029-11-21T12:00:00+0000",
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
    Scenario: Marking an event as complete will unlink related news items
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60}]
        """
        And "vocabularies"
        """
        [{
            "_id": "newscoveragestatus",
            "display_name": "News Coverage Status",
            "type": "manageable",
            "unique_field": "qcode",
            "items": [
                {"is_active": true, "qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                {"is_active": true, "qcode": "ncostat:notdec", "name": "coverage not decided yet",
                    "label": "On merit"},
                {"is_active": true, "qcode": "ncostat:notint", "name": "coverage not intended",
                    "label": "Not planned"},
                {"is_active": true, "qcode": "ncostat:onreq", "name": "coverage upon request",
                    "label": "On request"}
            ]
        }, {
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
        }]
        """
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
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "slugline": "test slugline",
            "planning_date": "2029-11-21T12:00:00.000Z"
        }]
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
                    "g2_content_type": "text"
                },
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
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        Then we get notifications
        """
        [{"event": "content:update"}, {"event": "content:link"}]
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "in_progress"
            }
        }
        """
        When we get "/assignments_history"
        Then we get list with 2 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "content_link"
            }
        ]}
        """
        When we post to "events"
        """
        {
            "name": "TestEvent",
            "slugline": "TestEvent",
            "_planning_item": "#planning._id#",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"event_item": "#events._id#"}
        """
        When we post to "/events/#events._id#/lock"
        """
        {
            "lock_action": "mark_completed"
        }
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {
            "completed": true,
            "actioned_date": "2029-11-21T12:00:00.000Z"
        }
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "completed": true,
            "actioned_date": "2029-11-21T12:00:00+0000"
        }
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "slugline": "test slugline",
            "planning_date": "2029-11-21T12:00:00+0000",
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
        {
            "assignment_id": null
        }
        """