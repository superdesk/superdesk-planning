# Created by superdesk at 7/18/18
Feature: Featured Planning
  # Enter feature description here

  @auth
  Scenario: Only featured planning items are allowed
    Given empty "planning_featured"
    Given "planning"
    """
    [{
        "slugline": "TestPlan",
        "state": "draft",
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
    Then we get error 400
    """
      {"_message": "A planning item in the list is not featured."}
    """

