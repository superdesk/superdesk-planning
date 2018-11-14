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
            "featured": "true",
            "planning_date": "2016-01-02"
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
            "state": "scheduled",
            "planning_date": "2016-01-02"
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

    @auth
    Scenario: Post a featured stories list using json formatter
        Given empty "planning_featured"
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "draft",
            "featured": "true",
            "pubstatus": "usable",
            "state": "scheduled",
            "planning_date": "2016-01-02"
        }]
        """
        When we post to "/products" with success
        """
        {
            "name":"prod-1","codes":"abc,xyz", "product_type": "both"
        }
        """
        And we post to "/subscribers" with success
        """
        {
            "name":"News1","media_type":"media", "subscriber_type": "digital", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
            "products": ["#products._id#"],
            "codes": "xyz, abc",
            "destinations": [{"name":"events", "format": "json_planning_featured", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
        }
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
        When we get "publish_queue"
        Then we get list with 1 items
        When we transmit items
        When we get "publish_queue"
        Then we get existing resource
        """
            {"_items": [{"state": "success"}]}
        """
        Then we store "PUBLISHQUEUE" with first item
        Then versioned file exists "/tmp/20291121-#PUBLISHQUEUE.item_version#-1.txt"

