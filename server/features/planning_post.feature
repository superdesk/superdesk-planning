Feature: Post Planning

    @auth
    Scenario: Post Planning
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        When we post to "/planning" with success
        """
        {
            "headline": "test headline",
            "slugline": "test slugline",
            "agendas": ["#agenda._id#"]
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
        When we get "published_planning"
        Then we get list with 1 items
        Then we store "PLANNING" with first item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning._id#",
                    "type": "planning",
                    "published_item": {
                        "_id": "#planning._id#",
                        "agendas": ["#agenda._id#"]
                    }
                }
            ]
        }
        """
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}&embedded={\"agendas\": 1}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning._id#",
                    "type": "planning",
                    "published_item": {
                        "_id": "#planning._id#",
                        "agendas": [{
                            "_id": "#agenda._id#",
                            "_type": "agenda",
                            "name": "TestAgenda"
                        }]
                    }
                }
            ]
        }
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

