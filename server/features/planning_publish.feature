Feature: Publish Planning

    @auth
    Scenario: Publish Planning
        When we post to "/planning" with success
        """
        {
            "headline": "test headline",
            "slugline": "test slugline"
        }
        """
        When we post to "/planning/publish"
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
        {"state": "published"}
        """
