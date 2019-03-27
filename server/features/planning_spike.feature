Feature: Planning Spike
    @auth
    Scenario: Planning state defaults to draft
        When we post to "planning"
        """
        [{
            "slugline": "TestPlan",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "state": "draft"
        }
        """

    @auth
    @notification
    Scenario: Spike a Planning item
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "draft",
            "planning_date": "2016-01-02",
            "coverages": [{
                "coverage_id": "cov1",
                "slugline": "TestCoverage 1",
                "planning": {
                    "internal_note": "Cover something please!"
                },
                "workflow_status": "draft",
                "news_coverage_status": {
                    "qcode": "ncostat:int",
                    "name": "Coverage intended"
                }
            }]

        }]
        """
        When we spike planning "#planning._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:spiked",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "state": "spiked",
            "revert_state": "draft"
        }
        """
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "planning_id": "#planning._id#",
            "operation": "spiked",
            "update": {"state" : "spiked", "revert_state": "draft"}
            }
            ]}
        """

    @auth
    @notification
    Scenario: Unspike a Planning item
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "spiked",
            "revert_state": "draft",
            "planning_date": "2016-01-02"
        }]
        """
        When we unspike planning "#planning._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:unspiked",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "state": "draft"
        }
        """
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "planning_id": "#planning._id#",
            "operation": "unspiked",
            "update": {"state" : "draft"}}
        ]}
        """

    @auth
    Scenario: Planning item can be spiked and unspiked only by user having privileges
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "planning_date": "2016-01-02"
        }]
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_planning_spike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike planning "#planning._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_planning_spike": 1,
                "planning_planning_unspike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike planning "#planning._id#"
        Then we get OK response
        When we unspike planning "#planning._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_planning_unspike": 1,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we unspike planning "#planning._id#"
        Then we get OK response

    @auth
    @notification
    Scenario: Unspike fails if associated event is still spiked
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
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "subject": [{"qcode": "test qcaode", "name": "test name"}],
                "location": [{"qcode": "test qcaode", "name": "test name"}],
                "state": "spiked"
            }
        ]
        """
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "spiked",
            "revert_state": "draft",
            "planning_date": "2016-01-02",
            "event_item": "#events._id#"
        }]
        """
        When we unspike planning "#planning._id#"
        Then we get error 400
        """
        {
            "_issues": {"validator exception": "400: Unspike failed. Associated event is spiked."}
        }
        """

    @auth
    @notification
    Scenario: Spike will delete assignment in workflow
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
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
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
        When we spike planning "#planning._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:spiked",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "test slugline",
            "state": "spiked",
            "revert_state": "draft"
        }
        """
        When we get "/assignments"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Spike will send notifications when delete of assignment fails
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
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
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
        When we patch "/archive/#archive._id#"
        """
        {"lock_user": "#users._id#"}
        """
        Then we get OK response
        When we spike planning "#planning._id#"
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
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "test slugline",
            "state": "spiked",
            "revert_state": "draft"
        }
        """
        When we get "/assignments"
        Then we get list with 1 items

    @auth
    @notification
    Scenario: Spike will succeed for never posted planning items in draft, cancelled, postponed state
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "draft",
            "planning_date": "2016-01-02"
        },
        {
            "slugline": "TestPlan",
            "state": "postponed",
            "planning_date": "2016-01-02"
        },
        {
            "slugline": "TestPlan",
            "state": "cancelled",
            "planning_date": "2016-01-02"
        }]
        """
        When we spike planning "#planning._id#"
        Then we get OK response
        When we get "planning"
        Then we get list with 3 items
        """
        {"_items": [{ "state": "spiked" }, { "state": "spiked" }, { "state": "spiked" }]}
        """

    @auth
    @notification
    Scenario: Spike will fail if planing item has ever been posted
        Given "planning"
        """
        [{
            "guid": "plan1",
            "slugline": "TestPlan",
            "state": "scheduled",
            "planning_date": "2016-01-02",
            "pubstatus": "usable"
        },
        {
            "guid": "plan2",
            "slugline": "TestPlan",
            "state": "postponed",
            "planning_date": "2016-01-02",
            "pubstatus": "usable"
        },
        {
            "guid": "plan3",
            "slugline": "TestPlan",
            "state": "cancelled",
            "planning_date": "2016-01-02",
            "pubstatus": "usable"
        }]
        """
        When we spike planning "plan1"
        Then we get error  400
        """
        {
            "_issues": {"validator exception": "400: Spike failed. Planning item in invalid state for spiking."}
        }
        """
        When we spike planning "plan2"
        Then we get error  400
        """
        {
            "_issues": {"validator exception": "400: Spike failed. Planning item in invalid state for spiking."}
        }
        """
        When we spike planning "plan3"
        Then we get error  400
        """
        {
            "_issues": {"validator exception": "400: Spike failed. Planning item in invalid state for spiking."}
        }
        """