Feature: Events Files

    @auth
    Scenario: Empty events_files list
        Given empty "events_files"
        When we get "/events_files"
        Then we get list with 0 items

    @auth
    Scenario: Upload a file
        When we upload a file "bike.jpg" to "/events_files"
        Then we get an event file reference
        And we can delete that event file
        
        
    @auth
    Scenario: Delete fails if a file
        When we upload a file "bike.jpg" to "/events_files"
        Then we get an event file reference
        When we get "events_files/"
        Then we get list with 1 items
        """
        {"_items": [{ "_id": "#events_files._id#" }]}
        """
        When we post to "events"
        """
        {
            "name": "Whatever",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "files": ["#events_files._id#"]

        }
        """
        Then we get OK response
        When we get "/events/#events._id#"
        Then we get existing resource
        """
        {
            "_id": "#events._id#",
            "type": "event",
            "slugline": "Test Event",
            "lock_user": "#CONTEXT_USER_ID#",
            "files": ["#events_files._id#"]
        }
        """
        When we delete "events_files/#events_files._id#"
        Then we get error 403
        
