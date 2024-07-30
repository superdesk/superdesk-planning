Feature: Search Events and Planning Locks
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
                "slugline": "p-unlocked",
                "planning_date": "2016-01-02T12:00:00+0000"
            },
            {
                "guid": "planning_2",
                "headline": "locked",
                "slugline": "p-locked",
                "planning_date": "2016-01-02T12:00:00+0000"
            },
            {
                "guid": "planning_3",
                "headline": "unlocked",
                "slugline": "ep-unlocked",
                "planning_date": "2016-01-02T12:00:00+0000",
                "related_events": [{"_id": "event_3", "link_type": "primary"}]
            },
            {
                "guid": "planning_4",
                "headline": "event locked",
                "slugline": "ep-e-locked",
                "planning_date": "2016-01-02T12:00:00+0000",
                "related_events": [{"_id": "event_4", "link_type": "primary"}]
            },
            {
                "guid": "planning_5",
                "headline": "planning locked",
                "slugline": "ep-p-locked",
                "planning_date": "2016-01-02T12:00:00+0000",
                "related_events": [{"_id": "event_5", "link_type": "primary"}]
            }
        ]
        """
        When we get "/events_planning_search?only_future=false&lock_state=locked"
        Then we get list with 0 items
        When we get "/events_planning_search?only_future=false&lock_state=unlocked"
        Then we get list with 10 items
        """
        {"_items": [
            {"slugline": "e-unlocked", "type": "event"},
            {"slugline": "e-locked", "type": "event"},
            {"slugline": "p-unlocked", "type": "planning"},
            {"slugline": "p-locked", "type": "planning"},
            {"slugline": "ep-unlocked", "type": "event"},
            {"slugline": "ep-e-locked", "type": "event"},
            {"slugline": "ep-p-locked", "type": "event"},
            {"slugline": "ep-unlocked", "type": "planning"},
            {"slugline": "ep-e-locked", "type": "planning"},
            {"slugline": "ep-p-locked", "type": "planning"}
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
        When we post to "/planning/planning_5/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we get "/events_planning_search?only_future=false&lock_state=locked"
        Then we get list with 6 items
        """
        {"_items": [
            {"slugline": "e-locked", "type": "event"},
            {"slugline": "p-locked", "type": "planning"},
            {"slugline": "ep-e-locked", "type": "event"},
            {"slugline": "ep-p-locked", "type": "event"},
            {"slugline": "ep-e-locked", "type": "planning"},
            {"slugline": "ep-p-locked", "type": "planning"}
        ]}
        """
        When we get "/events_planning_search?only_future=false&lock_state=unlocked"
        Then we get list with 4 items
        """
        {"_items": [
            {"slugline": "e-unlocked", "type": "event"},
            {"slugline": "p-unlocked", "type": "planning"},
            {"slugline": "ep-unlocked", "type": "event"},
            {"slugline": "ep-unlocked", "type": "planning"}
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
        When we post to "/planning/planning_1/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we get "/events_planning_search?only_future=false&lock_state=locked"
        Then we get list with 10 items
        """
        {"_items": [
            {"slugline": "e-unlocked", "type": "event"},
            {"slugline": "e-locked", "type": "event"},
            {"slugline": "p-unlocked", "type": "planning"},
            {"slugline": "p-locked", "type": "planning"},
            {"slugline": "ep-unlocked", "type": "event"},
            {"slugline": "ep-e-locked", "type": "event"},
            {"slugline": "ep-p-locked", "type": "event"},
            {"slugline": "ep-unlocked", "type": "planning"},
            {"slugline": "ep-e-locked", "type": "planning"},
            {"slugline": "ep-p-locked", "type": "planning"}
        ]}
        """
        When we get "/events_planning_search?only_future=false&lock_state=unlocked"
        Then we get list with 0 items
