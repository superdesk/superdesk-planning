Feature: Event Search Locks
    @auth
    Scenario: Search by locked events or associated planning item
        Given "events"
        """
        [
            {
                "guid": "event_1",
                "state": "draft",
                "name": "unlocked",
                "slugline": "e-unlocked",
                "dates": {
                    "start": "2016-01-02T00:00:00+0000",
                    "end": "2016-01-03T00:00:00+0000"
                }
            },
            {
                "guid": "event_2",
                "state": "draft",
                "name": "event locked",
                "slugline": "e-locked",
                "dates": {
                    "start": "2016-01-02T00:00:00+0000",
                    "end": "2016-01-03T00:00:00+0000"
                }
            },
            {
                "guid": "event_3",
                "state": "draft",
                "name": "unlocked",
                "slugline": "ep-unlocked",
                "dates": {
                    "start": "2016-01-02T00:00:00+0000",
                    "end": "2016-01-03T00:00:00+0000"
                }
            },
            {
                "guid": "event_4",
                "state": "draft",
                "name": "event locked",
                "slugline": "ep-e-locked",
                "dates": {
                    "start": "2016-01-02T00:00:00+0000",
                    "end": "2016-01-03T00:00:00+0000"
                }
            },
            {
                "guid": "event_5",
                "state": "draft",
                "name": "planning locked",
                "slugline": "ep-p-locked",
                "dates": {
                    "start": "2016-01-02T00:00:00+0000",
                    "end": "2016-01-03T00:00:00+0000"
                }
            }
        ]
        """
        And "planning"
        """
        [
            {
                "guid": "planning_1",
                "headline": "unlocked",
                "slugline": "ep-unlocked",
                "planning_date": "2016-01-02T12:00:00+0000",
                "related_events": [{"_id": "event_3", "link_type": "primary"}]
            },
            {
                "guid": "planning_2",
                "headline": "planning locked",
                "slugline": "ep-p-locked",
                "planning_date": "2016-01-02T12:00:00+0000",
                "related_events": [{"_id": "event_5", "link_type": "primary"}]
            }
        ]
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=locked"
        Then we get list with 0 items
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=unlocked"
        Then we get list with 5 items
        """
        {"_items": [
            {"slugline": "e-unlocked", "type": "event"},
            {"slugline": "e-locked", "type": "event"},
            {"slugline": "ep-unlocked", "type": "event"},
            {"slugline": "ep-e-locked", "type": "event"},
            {"slugline": "ep-p-locked", "type": "event"}
        ]}
        """
        When we post to "/events/event_2/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we post to "/events/event_4/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we post to "/planning/planning_2/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=locked"
        Then we get list with 3 items
        """
        {"_items": [
            {"slugline": "e-locked", "type": "event"},
            {"slugline": "ep-e-locked", "type": "event"},
            {"slugline": "ep-p-locked", "type": "event"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=unlocked"
        Then we get list with 2 items
        """
        {"_items": [
            {"slugline": "e-unlocked", "type": "event"},
            {"slugline": "ep-unlocked", "type": "event"}
        ]}
        """
        When we post to "/events/event_1/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we post to "/events/event_3/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=locked"
        Then we get list with 5 items
        """
        {"_items": [
            {"slugline": "e-unlocked", "type": "event"},
            {"slugline": "e-locked", "type": "event"},
            {"slugline": "ep-unlocked", "type": "event"},
            {"slugline": "ep-e-locked", "type": "event"},
            {"slugline": "ep-p-locked", "type": "event"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=unlocked"
        Then we get list with 0 items

    @auth
    Scenario: Search events by locked event or planning in a recurring series of events
        Given empty "events"
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
        When we post to "/planning"
        """
        [{
            "headline": "planning",
            "slugline": "planning",
            "planning_date": "2016-01-02T12:00:00+0000",
            "related_events": [{"_id": "#EVENT2._id#", "link_type": "primary"}]
        }]
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=locked"
        Then we get list with 0 items
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=unlocked"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#"},
            {"_id": "#EVENT2._id#"},
            {"_id": "#EVENT3._id#"}
        ]}
        """
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=locked"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#"},
            {"_id": "#EVENT2._id#"},
            {"_id": "#EVENT3._id#"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=unlocked"
        Then we get list with 0 items
        When we post to "/events/#EVENT2._id#/unlock" with success
        """
        {}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=locked"
        Then we get list with 0 items
        When we post to "/planning/#planning._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=locked"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#"},
            {"_id": "#EVENT2._id#"},
            {"_id": "#EVENT3._id#"}
        ]}
        """
        When we get "/events_planning_search?repo=events&only_future=false&lock_state=unlocked"
        Then we get list with 0 items
