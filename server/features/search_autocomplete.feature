Feature: Planning autocomplete
    Background: Setup config
        Given config update
        """
        {
            "ARCHIVE_AUTOCOMPLETE": true,
            "ARCHIVE_AUTOCOMPLETE_DAYS": 999
        }
        """

    @auth
    Scenario: Get distinct planning sluglines
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "versioncreated": "#DATE#",
            "state": "scheduled",
            "pubstatus": "usable",
            "slugline": "planning-1",
            "language": "en",
            "languages": ["en", "fr", "de"],
            "planning_date": "2021-01-11T16:00:00.000Z",
            "translations": [
                {"field": "slugline", "language": "en", "value": "planning-en-test"},
                {"field": "slugline", "language": "de", "value": "planning-de-test"}
            ]
        }]
        """
        # Suggests only the value in translations if populated
        When we get "/archive_autocomplete?field=slugline&language=en"
        Then we get list with 1 items
        """
        {"_items": [{"value": "planning-en-test"}]}
        """
        # Suggests base field if language translation not populated
        When we get "/archive_autocomplete?field=slugline&language=fr"
        Then we get list with 1 items
        """
        {"_items": [{"value": "planning-1"}]}
        """

    @auth
    Scenario: Get distinct coverage sluglines
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "versioncreated": "#DATE#",
            "state": "scheduled",
            "pubstatus": "usable",
            "slugline": "planning-1",
            "language": "en",
            "languages": ["en", "fr", "de"],
            "planning_date": "2021-01-11T16:00:00.000Z",
            "coverages": [{
                "planning": {"language": "en", "slugline": "coverage-en-slugline"},
                "workflow_state": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"}
            }, {
                "planning": {"language": "fr", "slugline": "coverage-fr-slugline"},
                "workflow_state": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"}
            }]
        }]
        """
        # Suggests both Planning and Coverage sluglines
        When we get "/archive_autocomplete?field=slugline&language=en"
        Then we get list with 2 items
        """
        {"_items": [
            {"value": "planning-1"},
            {"value": "coverage-en-slugline"}
        ]}
        """

    @auth
    Scenario: Get distinct event sluglines
        Given "events"
        """
        [{
            "_id": "event1",
            "state": "scheduled",
            "pubstatus": "usable",
            "slugline": "event-1",
            "language": "en",
            "languages": ["en", "fr", "de"],
            "dates": {
                "start": "2025-01-03T00:00:00+0000",
                "end": "2025-01-04T00:00:00+0000"
            },
            "translations": [
                {"field": "slugline", "language": "en", "value": "event-en-test"},
                {"field": "slugline", "language": "de", "value": "event-de-test"}
            ]
        }]
        """
        # Suggests only the value in translations if populated
        When we get "/archive_autocomplete?field=slugline&language=en"
        Then we get list with 1 items
        """
        {"_items": [{"value": "event-en-test"}]}
        """
        # Suggests base field if language translation not populated
        When we get "/archive_autocomplete?field=slugline&language=fr"
        Then we get list with 1 items
        """
        {"_items": [{"value": "event-1"}]}
        """

    @auth @wip
    Scenario: Can control what resources are used for suggestions
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "versioncreated": "#DATE#",
            "state": "scheduled",
            "pubstatus": "usable",
            "slugline": "planning-1",
            "language": "en",
            "languages": ["en", "fr", "de"],
            "planning_date": "2021-01-11T16:00:00.000Z",
            "translations": [
                {"field": "slugline", "language": "en", "value": "planning-en-test"},
                {"field": "slugline", "language": "de", "value": "planning-de-test"}
            ]
        }]
        """
        Given "events"
        """
        [{
            "_id": "event1",
            "state": "scheduled",
            "pubstatus": "usable",
            "slugline": "event-1",
            "language": "en",
            "languages": ["en", "fr", "de"],
            "dates": {
                "start": "2025-01-03T00:00:00+0000",
                "end": "2025-01-04T00:00:00+0000"
            },
            "translations": [
                {"field": "slugline", "language": "en", "value": "event-en-test"},
                {"field": "slugline", "language": "de", "value": "event-de-test"}
            ]
        }]
        """
        # Provides suggestions from all resources if argument not provided
        When we get "/archive_autocomplete?field=slugline&language=en"
        Then we get list with 2 items
        """
        {"_items": [
            {"value": "planning-en-test"},
            {"value": "event-en-test"}
        ]}
        """
        # Doesn't provide planning suggestions if ``planning`` not in resources argument
        When we get "/archive_autocomplete?field=slugline&language=en&resources=archive"
        Then we get list with 0 items
        # Provides planning suggestions if ``planning`` is in resources argument
        When we get "/archive_autocomplete?field=slugline&language=en&resources=archive,planning"
        Then we get list with 1 items
        """
        {"_items": [{"value": "planning-en-test"}]}
        """
        # Doesn't provide event suggestions if ``events`` not in resources argument
        When we get "/archive_autocomplete?field=slugline&language=en&resources=archive"
        Then we get list with 0 items
        # Provides event suggestions if ``events`` is in resources argument
        When we get "/archive_autocomplete?field=slugline&language=en&resources=archive,events"
        Then we get list with 1 items
        """
        {"_items": [{"value": "event-en-test"}]}
        """
