Feature: Event Search
    Background: Initial setup
        Given "events"
        """
        [{
            "firstcreated": "2016-01-01T00:00:00+0000", "versioncreated": "2016-01-04T00:00:00+0000",
            "guid": "event_1", "name": "event 1", "slugline": "test1 slugline",
            "dates": {
                "start": "2016-01-03T00:00:00+0000",
                "end": "2016-01-04T00:00:00+0000"
            }
        }, {
            "firstcreated": "2016-01-02T00:00:00+0000", "versioncreated": "2016-01-03T00:00:00+0000",
            "guid": "event_2", "name": "event 2", "slugline": "test1 slugline",
            "dates": {
                "start": "2016-01-01T00:00:00+0000",
                "end": "2016-01-02T00:00:00+0000"
            }
        }, {
            "firstcreated": "2016-01-03T00:00:00+0000", "versioncreated": "2016-01-02T00:00:00+0000",
            "guid": "event_3", "name": "event 3", "slugline": "test1 slugline",
            "dates": {
                "start": "2016-01-04T00:00:00+0000",
                "end": "2016-01-05T00:00:00+0000"
            }
        }, {
            "firstcreated": "2016-01-04T00:00:00+0000", "versioncreated": "2016-01-01T00:00:00+0000",
            "guid": "event_4", "name": "event 4", "slugline": "test1 slugline",
            "dates": {
                "start": "2016-01-02T00:00:00+0000",
                "end": "2016-01-03T00:00:00+0000"
            }
        }]
        """
        And "planning"
        """
        [{
            "firstcreated": "2016-01-01T01:00:00+0000", "versioncreated": "2016-01-04T01:00:00+0000",
            "guid": "plan_1", "name": "plan 1", "slugline": "test1 slugline",
            "planning_date": "2016-01-03T01:00:00+0000"
        }, {
            "firstcreated": "2016-01-02T01:00:00+0000", "versioncreated": "2016-01-03T01:00:00+0000",
            "guid": "plan_2", "name": "plan 2", "slugline": "test2 slugline",
            "planning_date": "2016-01-01T01:00:00+0000",
            "event_item": "event_2"
        }, {
            "firstcreated": "2016-01-03T01:00:00+0000", "versioncreated": "2016-01-02T01:00:00+0000",
            "guid": "plan_3", "name": "plan 3", "slugline": "test3 slugline",
            "planning_date": "2016-01-04T01:00:00+0000"
        }, {
            "firstcreated": "2016-01-04T01:00:00+0000", "versioncreated": "2016-01-01T01:00:00+0000",
            "guid": "plan_4", "name": "plan 4", "slugline": "test4 slugline",
            "planning_date": "2016-01-02T01:00:00+0000",
            "event_item": "event_4"
        }]
        """

    @auth
    Scenario: Sorting events
        # Sort by the Event's schedule by default
        When we get "events_planning_search?repo=events&only_future=false"
        Then we get the following order
        """
        ["event_2", "event_4", "event_1", "event_3"]
        """
        # Sort by creation date, in ascending order (default order)
        When we get "events_planning_search?repo=events&only_future=false&sort_field=created"
        Then we get the following order
        """
        ["event_1", "event_2", "event_3", "event_4"]
        """
        # Sort by creation date, in descending order
        When we get "events_planning_search?repo=events&only_future=false&sort_field=created&sort_order=descending"
        Then we get the following order
        """
        ["event_4", "event_3", "event_2", "event_1"]
        """
        # Sort by updated date, in ascending order (default order)
        When we get "events_planning_search?repo=events&only_future=false&sort_field=updated"
        Then we get the following order
        """
        ["event_4", "event_3", "event_2", "event_1"]
        """
        # Sort by updated date, in descending order
        When we get "events_planning_search?repo=events&only_future=false&sort_field=updated&sort_order=descending"
        Then we get the following order
        """
        ["event_1", "event_2", "event_3", "event_4"]
        """
        # Update an item, then sort by updated date in descending order
        When we patch "/events/event_3"
        """
        {"definition_short": "updated"}
        """
        When we get "events_planning_search?repo=events&only_future=false&sort_field=updated&sort_order=descending"
        Then we get the following order
        """
        ["event_3", "event_1", "event_2", "event_4"]
        """

    @auth
    Scenario: Sorting planning
        # Sort by the Planning date by default
        When we get "events_planning_search?repo=planning&only_future=false"
        Then we get the following order
        """
        ["plan_2", "plan_4", "plan_1", "plan_3"]
        """
        # Sort by creation date, in ascending order (default order)
        When we get "events_planning_search?repo=planning&only_future=false&sort_field=created"
        Then we get the following order
        """
        ["plan_1", "plan_2", "plan_3", "plan_4"]
        """
        # Sort by creation date, in descending order
        When we get "events_planning_search?repo=planning&only_future=false&sort_field=created&sort_order=descending"
        Then we get the following order
        """
        ["plan_4", "plan_3", "plan_2", "plan_1"]
        """
        # Sort by updated date, in ascending order (default order)
        When we get "events_planning_search?repo=planning&only_future=false&sort_field=updated"
        Then we get the following order
        """
        ["plan_4", "plan_3", "plan_2", "plan_1"]
        """
        # Sort by updated date, in descending order
        When we get "events_planning_search?repo=planning&only_future=false&sort_field=updated&sort_order=descending"
        Then we get the following order
        """
        ["plan_1", "plan_2", "plan_3", "plan_4"]
        """
        # Update an item, then sort by updated date in descending order
        When we patch "/planning/plan_3"
        """
        {"description_text": "updated"}
        """
        When we get "events_planning_search?repo=planning&only_future=false&sort_field=updated&sort_order=descending"
        Then we get the following order
        """
        ["plan_3", "plan_1", "plan_2", "plan_4"]
        """

    @auth
    Scenario: Sorting combined
        # Sort by the Event's schedule by default
        When we get "events_planning_search?repo=combined&only_future=false"
        Then we get the following order
        """
        ["event_2", "event_4", "event_1", "plan_1", "event_3", "plan_3"]
        """
        # Sort by creation date, in ascending order (default order)
        When we get "events_planning_search?repo=combined&only_future=false&sort_field=created"
        Then we get the following order
        """
        ["event_1", "plan_1", "event_2", "event_3", "plan_3", "event_4"]
        """
        # Sort by creation date, in descending order
        When we get "events_planning_search?repo=combined&only_future=false&sort_field=created&sort_order=descending"
        Then we get the following order
        """
        ["event_4", "plan_3", "event_3", "event_2", "plan_1", "event_1"]
        """
        # Sort by updated date, in ascending order (default order)
        When we get "events_planning_search?repo=combined&only_future=false&sort_field=updated"
        Then we get the following order
        """
        ["event_4", "event_3", "plan_3", "event_2", "event_1", "plan_1"]
        """
        # Sort by updated date, in descending order
        When we get "events_planning_search?repo=combined&only_future=false&sort_field=updated&sort_order=descending"
        Then we get the following order
        """
        ["plan_1", "event_1", "event_2", "plan_3", "event_3", "event_4"]
        """
        # Update an item, then sort by updated date in descending order
        When we patch "/events/event_3"
        """
        {"definition_short": "updated"}
        """
        When we get "events_planning_search?repo=combined&only_future=false&sort_field=updated&sort_order=descending"
        Then we get the following order
        """
        ["event_3", "plan_1", "event_1", "event_2", "plan_3", "event_4"]
        """
