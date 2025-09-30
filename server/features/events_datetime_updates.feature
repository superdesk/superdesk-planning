Feature: Updating Event date or time from the editor
    Background: Setup env
        Given config update
        """
        {"PLANNING_EVENT_LINK_METHOD": "many_secondary"}
        """
        Given "events"
        """
        [{
            "guid": "event1",
            "name": "Test Event",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "state": "draft"
        }]
        """

    @auth
    Scenario: Event schedule updates not supported when PLANNING_EVENT_LINK_METHOD is not many_secondary
        Given config update
        """
        {"PLANNING_EVENT_LINK_METHOD": "one_primary"}
        """
        When we patch "/events/event1"
        """
        {
            "name": "Test Event 2",
            "dates": {
                "start": "2029-11-21T13:00:00+0000",
                "end": "2029-11-21T15:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "event1",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "_planning_schedule": [{"scheduled": "2029-11-21T12:00:00+0000"}]
        }
        """
        Given config update
        """
        {"PLANNING_EVENT_LINK_METHOD": "one_primary_many_secondary"}
        """
        When we patch "/events/event1"
        """
        {
            "name": "Test Event 2",
            "dates": {
                "start": "2029-11-21T13:00:00+0000",
                "end": "2029-11-21T15:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "event1",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "_planning_schedule": [{"scheduled": "2029-11-21T12:00:00+0000"}]
        }
        """

    @auth
    Scenario: Change time of single Event
        When we get "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "_planning_schedule": [{"scheduled": "2029-11-21T12:00:00+0000"}]
        }
        """
        When we patch "/events/event1"
        """
        {
            "name": "Test Event 2",
            "dates": {
                "start": "2029-11-21T13:00:00+0000",
                "end": "2029-11-21T15:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "event1",
            "dates": {
                "start": "2029-11-21T13:00:00+0000",
                "end": "2029-11-21T15:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "_planning_schedule": [{"scheduled": "2029-11-21T13:00:00+0000"}]
        }
        """

    @auth
    Scenario: Change date & time of single Event
        When we get "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "dates": {
                "start": "2029-11-21T12:00:00+0000",
                "end": "2029-11-21T14:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "_planning_schedule": [{"scheduled": "2029-11-21T12:00:00+0000"}]
        }
        """
        When we patch "/events/event1"
        """
        {
            "name": "Test Event 2",
            "dates": {
                "start": "2029-11-22T13:00:00+0000",
                "end": "2029-11-22T15:00:00+0000",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "event1",
            "dates": {
                "start": "2029-11-22T13:00:00+0000",
                "end": "2029-11-22T15:00:00+0000",
                "tz": "Australia/Sydney"
            },
            "_planning_schedule": [{"scheduled": "2029-11-22T13:00:00+0000"}]
        }
        """

    @auth
    Scenario: Change schedule of a series of events
        Given empty "events"
        When we post to "/events"
        """
        [{
            "name": "Daily Club",
            "dates": {
                "start": "2044-11-21T08:00:00+0000",
                "end": "2044-11-21T10:00:00+0000",
                "tz": "Australia/Sydney",
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
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2044-11-21T08:00:00+0000", "end": "2044-11-21T10:00:00+0000"}
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2044-11-22T08:00:00+0000", "end": "2044-11-22T10:00:00+0000"}
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2044-11-23T08:00:00+0000", "end": "2044-11-23T10:00:00+0000"}
        }]}
        """
        # Update time of 1 Event
        When we patch "/events/#EVENT2._id#"
        """
        {
            "name": "Daily Club v2",
            "dates": {
                "start": "2044-11-22T10:00:00+0000",
                "end": "2044-11-22T11:00:00+0000"
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2044-11-21T08:00:00+0000", "end": "2044-11-21T10:00:00+0000"}
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v2",
            "dates": {"start": "2044-11-22T10:00:00+0000", "end": "2044-11-22T11:00:00+0000"}
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2044-11-23T08:00:00+0000", "end": "2044-11-23T10:00:00+0000"}
        }]}
        """

        # Update time of future Events
        When we patch "/events/#EVENT2._id#"
        """
        {
            "update_method": "future",
            "name": "Daily Club v3",
            "dates": {
                "start": "2044-11-22T11:00:00+0000",
                "end": "2044-11-22T12:00:00+0000"
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2044-11-21T08:00:00+0000", "end": "2044-11-21T10:00:00+0000"}
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v3",
            "dates": {"start": "2044-11-22T11:00:00+0000", "end": "2044-11-22T12:00:00+0000"}
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v3",
            "dates": {"start": "2044-11-23T11:00:00+0000", "end": "2044-11-23T12:00:00+0000"}
        }]}
        """

        # Update time of all Events
        When we patch "/events/#EVENT3._id#"
        """
        {
            "update_method": "all",
            "name": "Daily Club v4",
            "dates": {
                "start": "2044-11-23T07:00:00+0000",
                "end": "2044-11-23T11:00:00+0000"
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v4",
            "dates": {"start": "2044-11-21T07:00:00+0000", "end": "2044-11-21T11:00:00+0000"}
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v4",
            "dates": {"start": "2044-11-22T07:00:00+0000", "end": "2044-11-22T11:00:00+0000"}
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v4",
            "dates": {"start": "2044-11-23T07:00:00+0000", "end": "2044-11-23T11:00:00+0000"}
        }]}
        """

        # Update date & time of all Events
        When we patch "/events/#EVENT1._id#"
        """
        {
            "update_method": "all",
            "name": "Daily Club v5",
            "dates": {
                "start": "2044-12-01T08:00:00+0000",
                "end": "2044-12-01T12:00:00+0000"
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v5",
            "dates": {"start": "2044-12-01T08:00:00+0000", "end": "2044-12-01T12:00:00+0000"}
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v5",
            "dates": {"start": "2044-12-02T08:00:00+0000", "end": "2044-12-02T12:00:00+0000"}
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v5",
            "dates": {"start": "2044-12-03T08:00:00+0000", "end": "2044-12-03T12:00:00+0000"}
        }]}
        """
