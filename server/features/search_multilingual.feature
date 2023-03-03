Feature: Search multilingual metadata
    @auth
    Scenario: Can search multilingual data
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
        And "events"
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
                {"field": "definition_short", "language": "en", "value": "desc-en"},
                {"field": "definition_short", "language": "de", "value": "desc-de"}
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
