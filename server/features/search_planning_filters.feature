Feature: Planning Search Filters
    @auth
    Scenario: Search using Agenda with ObjectId
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "guid": "plan_with_agenda",
            "headline": "test agenda",
            "slugline": "slug_agenda",
            "name": "name_agenda",
            "planning_date": "2016-01-02T14:00:00+0000",
            "agendas": ["#agenda._id#"]
        }]
        """
        Then we get OK response
        When we post to "events_planning_filters"
        """
        [{
            "name": "Test",
            "item_type": "planning",
            "params": {
                "agendas": ["#agenda._id#"]
            }
        }]
        """
        Then we get OK response
        When we get "/events_planning_search?repo=planning&only_future=false&filter_id=#events_planning_filters._id#"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "plan_with_agenda"}
        ]}
        """

    @auth
    Scenario: Search using urgency
        When we post to "planning"
        """
        [{
            "guid": "plan_with_urgency_2",
            "headline": "test agenda 2",
            "slugline": "slug_agenda 2",
            "name": "name_agenda",
            "planning_date": "2016-01-02T14:00:00+0000",
            "urgency": 2
        }, {
            "guid": "plan_with_urgency_3",
            "headline": "test agenda 3",
            "slugline": "slug_agenda 3",
            "name": "name_agenda",
            "planning_date": "2016-01-02T14:00:00+0000",
            "urgency": 3
        }]
        """
        Then we get OK response
        When we post to "events_planning_filters"
        """
        [{
            "name": "Test",
            "item_type": "planning",
            "params": {
                "urgency": {"qcode": 2, "name": "2"}
            }
        }]
        """
        Then we get OK response
        When we get "/events_planning_search?repo=planning&only_future=false&filter_id=#events_planning_filters._id#"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "plan_with_urgency_2"}
        ]}
        """
