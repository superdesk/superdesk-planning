# Created by superdesk at 7/27/18
Feature: Post Featured Planning

    @auth
    Scenario: Post fails if any associated planning item is not posted
        Given empty "planning_featured"
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "draft",
            "featured": "true"
        }]
        """
        When we post to "/planning_featured"
        """
        [{
            "date": "2029-11-21T12:00:00.000Z",
            "tz": "Australia/Sydney",
            "items": ["#planning._id#"]
        }]
        """
        When we patch "/planning_featured/#planning_featured._id#"
        """
        {
            "tz": "Australia/Sydney",
            "items": ["#planning._id#"],
            "posted": "True"
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: Not all planning items are posted. Aborting post action."}}
        """

    @auth
    Scenario: Post a featured stories list
        Given empty "planning_featured"
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "draft",
            "featured": "true",
            "pubstatus": "usable",
            "state": "scheduled"
        }]
        """
        When we post to "/planning_featured"
        """
        [{
            "date": "2029-11-21T12:00:00.000Z",
            "tz": "Australia/Sydney",
            "items": ["#planning._id#"]
        }]
        """
        When we patch "/planning_featured/#planning_featured._id#"
        """
        {
            "tz": "Australia/Sydney",
            "items": ["#planning._id#"],
            "posted": "True"
        }
        """
        Then we get OK response
        When we get "/planning_featured/#planning_featured._id#"
        Then we get existing resource
        """
        {
          "_id": "#planning_featured._id#",
          "posted": true
        }
        """
        When we get "published_planning"
        Then we get list with 1 items
        Then we store "PLANNING" with first item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning_featured._id#",
                    "type": "planning_featured",
                    "published_item": {
                        "_id": "#planning_featured._id#",
                        "items": ["#planning._id#"]
                    }
                }
            ]
        }
        """