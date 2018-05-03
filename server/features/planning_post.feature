Feature: Post Planning

    @auth
    Scenario: Post Planning
        When we post to "/planning" with success
        """
        {
            "headline": "test headline",
            "slugline": "test slugline"
        }
        """
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"state": "scheduled"}
        """

    @auth
    Scenario: Fail to post a planning item with insufficient privileges
    When we post to "/planning" with success
    """
    {
        "headline": "test headline",
        "slugline": "test slugline"
    }
    """
    When we patch "/users/#CONTEXT_USER_ID#"
    """
    {"user_type": "user", "privileges": {"planning_event_post": 0, "users": 1}}
    """
    When we post to "/planning/post"
    """
    {
        "planning": "#planning._id#",
        "etag": "#planning._etag#",
        "pubstatus": "usable"
    }
    """
    Then we get error 403

