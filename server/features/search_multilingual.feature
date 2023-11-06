Feature: Search multilingual metadata
    Background: Init system metadata
        Given "vocabularies"
        """
        [{
            "_id": "languages",
            "display_name": "Languages",
            "type": "manageable",
            "unique_field": "qcode",
            "service": {"all": 1},
            "items": [
                {"qcode": "nl", "name": "Dutch", "is_active": true},
                {"qcode": "fr", "name": "French", "is_active": true},
                {"qcode": "en", "name": "English", "is_active": true},
                {"qcode": "de", "name": "German", "is_active": true}
            ]
        }]
        """
        And "planning_types"
        """
        [{
            "_id": "event",
            "name": "event",
            "editor": {
                "language": {"enabled": true}
            },
            "schema": {
                "language": {
                    "languages": ["en", "de"],
                    "default_language": "en",
                    "multilingual": true,
                    "required": true
                },
                "name": {"multilingual": true},
                "slugline": {"multilingual": true},
                "definition_short": {"multilingual": true}
            }
        }]
        """

    @auth
    Scenario: Can search multilingual data
        Given "events"
        """
        [{
            "guid": "event_123",
            "slugline": "slugline",
            "name": "name",
            "definition_short": "desc",
            "dates": {
                "start": "2045-01-20T00:00:00+0000",
                "end": "2045-01-21T00:00:00+0000"
            },
            "translations": [
                {"field": "slugline", "language": "en", "value": "slugline-en"},
                {"field": "slugline", "language": "de", "value": "slugline-de"},
                {"field": "name", "language": "en", "value": "name-en"},
                {"field": "name", "language": "de", "value": "name-de"},
                {"field": "definition_short", "language": "en", "value": "<p>My <b>Description</b> is here</p>"},
                {"field": "definition_short", "language": "de", "value": "<p><h2>Über</h2> dem <b>Gebäude<b></p>"}
            ]
        }]
        """
        When we get "/planning_types/event"
        Then we get existing resource
        """
        {
            "name": "event",
            "editor": {
                "language": {"enabled": true}
            },
            "schema": {
                "language": {
                    "languages": ["en", "de"],
                    "default_language": "en",
                    "multilingual": true,
                    "required": true
                },
                "name": {"multilingual": true},
                "slugline": {"multilingual": true},
                "definition_short": {"multilingual": true}
            }
        }
        """
        When we get "/events_planning_search?repo=events&name=name-en"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event_123"}]}
        """
        When we get "/events_planning_search?repo=events&name=name-de"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event_123"}]}
        """
        When we get "/events_planning_search?repo=events&name=name-fr"
        Then we get list with 0 items
        """
        {"_items": []}
        """
        When we get "/events_planning_search?repo=events&full_text=my%20description%20is%20here"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event_123"}]}
        """
        When we get "/events_planning_search?repo=events&full_text=uber%20dem%20Gebaude"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "event_123"}]}
        """

    @auth
    Scenario: Can search languages fields
        Given "events"
        """
        [{
            "guid": "event-single-en", "slugline": "slugline", "name": "name",
            "dates": {"start": "2045-01-20T00:00:00+0000", "end": "2045-01-20T01:00:00+0000"},
            "language": "en"
        }, {
            "guid": "event-single-nl", "slugline": "slugline", "name": "name",
            "dates": {"start": "2045-01-20T02:00:00+0000", "end": "2045-01-20T03:00:00+0000"},
            "language": "nl"
        }, {
            "guid": "event-multi-en", "slugline": "slugline", "name": "name",
            "dates": {"start": "2045-01-20T04:00:00+0000", "end": "2045-01-20T05:00:00+0000"},
            "languages": ["en"]
        }, {
            "guid": "event-multi-nl", "slugline": "slugline", "name": "name",
            "dates": {"start": "2045-01-20T06:00:00+0000", "end": "2045-01-20T07:00:00+0000"},
            "languages": ["nl"]
        }, {
            "guid": "event-multi-en-nl", "slugline": "slugline", "name": "name",
            "dates": {"start": "2045-01-20T08:00:00+0000", "end": "2045-01-20T09:00:00+0000"},
            "languages": ["en", "nl"]
        }, {
            "guid": "event-single-de", "slugline": "slugline", "name": "name",
            "dates": {"start": "2045-01-20T10:00:00+0000", "end": "2045-01-20T11:00:00+0000"},
            "language": "de"
        }, {
            "guid": "event-multi-de", "slugline": "slugline", "name": "name",
            "dates": {"start": "2045-01-20T10:00:00+0000", "end": "2045-01-20T11:00:00+0000"},
            "languages": ["de"]
        }]
        """
        When we get "/events_planning_search?repo=events&language=en"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "event-single-en"},
            {"_id": "event-multi-en"},
            {"_id": "event-multi-en-nl"}
        ]}
        """
        When we get "/events_planning_search?repo=events&language=de"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event-single-de"},
            {"_id": "event-multi-de"}
        ]}
        """
        When we get "/events_planning_search?repo=events&language=fr"
        Then we get list with 0 items
        When we get "/events_planning_search?repo=events&language=en,nl"
        Then we get list with 5 items
        """
        {"_items": [
            {"_id": "event-single-en"},
            {"_id": "event-single-nl"},
            {"_id": "event-multi-en"},
            {"_id": "event-multi-nl"},
            {"_id": "event-multi-en-nl"}
        ]}
        """
