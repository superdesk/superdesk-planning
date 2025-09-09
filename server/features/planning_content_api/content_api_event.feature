Feature: Events Content API
    Background: Setup publishing resources
        When we configure planning for publishing to capi

        # Create test events
        When we post to "events"
        """
        [{
            "guid": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "dates": {
                "start": "2042-01-01T10:00:00+0000",
                "end": "2042-01-01T12:00:00+0000"
            }
        }]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we post to "events"
        """
        [{
            "guid": "event2",
            "name": "Finance Event",
            "slugline": "finance-event",
            "anpa_category": [{"name": "Finance", "qcode": "finance"}],
            "dates": {
                "start": "2042-01-02T09:00:00+0000",
                "end": "2042-01-02T11:00:00+0000"
            }
        }]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response

    @auth
    Scenario: Event subscriber permissions
        # Test endpoints when not authenticated
        When we get capi "/events"
        Then we get error 403
        When we get capi "/events/event1"
        Then we get error 403
        When we get capi "/events/event2"
        Then we get error 403

        # Test Sports Subscriber (should only see sports event)
        When we set capi auth token to "#subscriber_token_0._id#"
        When we get capi "/events"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "event1", "subscribers": "__no_value__"}
        ]}
        """
        When we get capi "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "subscribers": "__no_value__"
        }
        """
        When we get capi "/events/event2"
        Then we get error 404

        # Test Subscriber with access to all content
        When we set capi auth token to "#subscriber_token_1._id#"
        When we get capi "/events"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1", "subscribers": "__no_value__"},
            {"_id": "event2", "subscribers": "__no_value__"}
        ]}
        """
        When we get capi "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "subscribers": "__no_value__"
        }
        """
        When we get capi "/events/event2"
        Then we get existing resource
        """
        {
            "_id": "event2",
            "name": "Finance Event",
            "slugline": "finance-event",
            "anpa_category": [{"name": "Finance", "qcode": "finance"}],
            "subscribers": "__no_value__"
        }
        """

    @auth
    Scenario: Search Event dates
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test start_date and end_date filter (dates.start should match)
        When we get capi "/events?start_date=2042-01-01&end_date=2042-01-01"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "sports-event", "subscribers": "__no_value__"}]}
        """

        When we get capi "/events?start_date=2042-01-02&end_date=2042-01-02"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "finance-event", "subscribers": "__no_value__"}]}
        """

    @auth
    Scenario: Event filter search
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test q search
        When we get capi "/events?q=sports-event"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "sports-event", "subscribers": "__no_value__"}]}
        """

    @auth
    Scenario: Event field projection
        When we set capi auth token to "#subscriber_token_1._id#"
        # Test include_fields
        When we get capi "/events?include_fields=slugline"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1", "slugline": "sports-event", "anpa_category": "__no_value__", "subscribers": "__no_value__"},
            {"_id": "event2", "slugline": "finance-event", "anpa_category": "__no_value__", "subscribers": "__no_value__"}
        ]}
        """
        When we get capi "/events?exclude_fields=anpa_category"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "event1", "slugline": "sports-event", "anpa_category": "__no_value__", "subscribers": "__no_value__"},
            {"_id": "event2", "slugline": "finance-event", "anpa_category": "__no_value__", "subscribers": "__no_value__"}
        ]}
        """

    @auth
    Scenario: Event page params
        When we set capi auth token to "#subscriber_token_1._id#"
        When we get capi "/events"
        Then we get existing resource
        """
        {
            "_items": [
                {"_id": "event1", "subscribers": "__no_value__"},
                {"_id": "event2", "subscribers": "__no_value__"}
            ],
            "_meta": {"max_results": 25, "page": 1, "total": 2}
        }
        """
        When we get capi "/events?max_results=1"
        Then we get existing resource
        """
        {
            "_items": [{"_id": "event1", "subscribers": "__no_value__"}],
            "_meta": {"max_results": 1, "page": 1, "total": 2}
        }
        """
        When we get capi "/events?max_results=1&page=1"
        Then we get existing resource
        """
        {
            "_items": [{"_id": "event1", "subscribers": "__no_value__"}],
            "_meta": {"max_results": 1, "page": 1, "total": 2}
        }
        """
        When we get capi "/events?max_results=1&page=2"
        Then we get existing resource
        """
        {
            "_items": [{"_id": "event2", "subscribers": "__no_value__"}],
            "_meta": {"max_results": 1, "page": 2, "total": 2}
        }
        """

    @auth
    Scenario: Test ContentAPIEventResource model
        # Create test events
        Given empty "events_capi"
        And "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        When we post to "events"
        """
        [{
            "guid": "full-event-1",
            "name": "Sports Event 1",
            "slugline": "sports-event-1",
            "language": "en",
            "dates": {
                "start": "2042-01-01T10:00:00+0000",
                "end": "2042-01-01T12:00:00+0000"
            },
            "firstcreated": "2023-07-01T10:00:00+0000",
            "version": 3,
            "priority": 2,
            "ingest_id": "event-ing-1",
            "source": "sf",
            "original_source": "sf-old",
            "anpa_category": [
                {"name": "Sports", "qcode": "sports"}
            ],
            "subject": [
                {"qcode": "17004000", "name": "Statistics"},
                {"qcode": "9", "name": "Politiikka", "scheme": "sttdepartment"},
                {"qcode": "type21", "name": "Mediatilaisuudet", "scheme": "event_type"},
                {"qcode": "11000000", "name": "Politiikka", "scheme": "sttsubj"}
            ],
            "place": [{
                "group": "Rest Of World",
                "name": "ASIA",
                "state": "",
                "qcode": "ASIA",
                "world_region": "Asia",
                "country": ""
            }],
            "ednote": "Editorial note on the thing happening",
            "definition_short": "Something was going to happen, then not, and now so",
            "definition_long": "Or a longer version of what I just said",
            "registration_details": "Please see foo for rego",
            "invitation_details": "Please see bar for details",
            "accreditation_info": "Provide info here",
            "accreditation_deadline": "2025-05-05",
            "reference": "abcd123",
            "links": ["https://www.foo.bar.org"],
            "occur_status": {
                "qcode": "eocstat:eos5",
                "name": "Planned, occurs certainly",
                "label": "Planned, occurs certainly"
            },
            "location": [
                {
                    "address": {
                        "boundingbox": ["49.9419006", "50.1774301", "14.2244355", "14.7067869"],
                        "city": "Helsinki",
                        "state": "Uusimaa",
                        "country": "Suomi",
                        "line": ["1234 some road"],
                        "locality": "Helsinki",
                        "title": "Praha Helsinki",
                        "type": "city",
                        "extra": {
                            "sttlocationalias": "14068",
                            "sttcity": "35",
                            "sttstate": "31",
                            "sttcountry": "1",
                            "iso3166": "iso3166-1a2:FI"
                        }
                    },
                    "formatted_address": "Prague Czechia",
                    "location": {"lat": 50.0874654, "lon": 14.4212535},
                    "name": "Praha Helsinki",
                    "qcode": "urn:newsml:localhost:5000:2019-06-04T11:55:43.146372:16d4043c-826e-4c25-a743-5f747baedde7",
                    "details": "Knock 3 times"
                }
            ],
            "event_contact_info": ["#contacts._id#"],
            "calendars": [{"name": "finance", "qcode": "finance"}],
            "related_items": [
                {
                    "type": "text",
                    "pubstatus": "usable",
                    "versioncreated": "2024-02-20T08:37:53+0000",
                    "guid": "0be5e148-2cd5-4a8b-bf76-a19fe21b2cb7",
                    "state": "in_progress",
                    "source": "sf",
                    "search_provider": "660e6a002c73e11f433f0210",
                    "headline": "Text Pack 2",
                    "slugline": "packs",
                    "version": 2
                },
                {
                    "type": "picture",
                    "pubstatus": "usable",
                    "versioncreated": "2024-02-20T08:37:07+0000",
                    "guid": "941f41db-4444-4aaf-94d9-cd48cd091a59",
                    "state": "in_progress",
                    "source": "sf",
                    "search_provider": "660e6a002c73e11f433f0210",
                    "headline": "Picture Pack 1",
                    "slugline": "packs",
                    "version": 1
                }
            ],
            "extra": {
                "stt_events": "259431",
                "stt_topics": "584717"
            }
        }]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response

        When we set capi auth token to "#subscriber_token_1._id#"
        When we get capi "/events"
        Then we get list with 1 items
        """
        {"_items": [{
            "_id": "full-event-1",
            "pubstatus": "usable",
            "type": "event",
            "subscribers": "__no_value__",
            "firstcreated": "2023-07-01T10:00:00+0000",
            "versioncreated": "__now__",
            "dates": {
                "startDate": "2042-01-01T10:00:00+0000",
                "endDate": "2042-01-01T12:00:00+0000"
            },
            "occur_status": {
                "label": "Planned, occurs certainly",
                "name": "Planned, occurs certainly",
                "qcode": "eocstat:eos5"
            },
            "products": [{"code": "__objectid__", "name": "sports"}],
            "version": 3,
            "ingest_id": "event-ing-1",
            "source": "sf",
            "original_source": "sf-old",
            "slugline": "sports-event-1",
            "name": "Sports Event 1",
            "reference": "abcd123",
            "definition_short": "Something was going to happen, then not, and now so",
            "definition_long": "Or a longer version of what I just said",
            "registration_details": "Please see foo for rego",
            "invitation_details": "Please see bar for details",
            "accreditation_deadline": "2025-05-05",
            "accreditation_info": "Provide info here",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "calendars": [{"name": "finance", "qcode": "finance" }],
            "priority": 2,
            "subject": [
                {"name": "Statistics", "qcode": "17004000"},
                {"name": "Politiikka", "qcode": "9", "scheme": "sttdepartment"},
                {"name": "Mediatilaisuudet", "qcode": "type21", "scheme": "event_type"},
                {"name": "Politiikka", "qcode": "11000000", "scheme": "sttsubj"}
            ],
            "language": "en",
            "place": [{
                "country": "",
                "name": "ASIA",
                "qcode": "ASIA",
                "state": "",
                "world_region": "Asia"
            }],
            "ednote": "Editorial note on the thing happening",
            "links": ["https://www.foo.bar.org"],
            "event_contact_info": [],
            "location": [{
                "address": {
                    "boundingbox": ["49.9419006", "50.1774301", "14.2244355", "14.7067869"],
                    "city": "Helsinki",
                    "state": "Uusimaa",
                    "country": "Suomi",
                    "line": ["1234 some road"],
                    "locality": "Helsinki",
                    "title": "Praha Helsinki",
                    "type": "city",
                    "extra": {
                        "sttlocationalias": "14068",
                        "sttcity": "35",
                        "sttstate": "31",
                        "sttcountry": "1",
                        "iso3166": "iso3166-1a2:FI"
                    }
                },
                "formatted_address": "Prague Czechia",
                "location": {"lat": 50.0874654, "lon": 14.4212535},
                "name": "Praha Helsinki",
                "qcode": "urn:newsml:localhost:5000:2019-06-04T11:55:43.146372:16d4043c-826e-4c25-a743-5f747baedde7",
                "details": "Knock 3 times"
            }],
            "related_items": [
                {
                    "type": "text",
                    "pubstatus": "usable",
                    "versioncreated": "2024-02-20T08:37:53+0000",
                    "guid": "0be5e148-2cd5-4a8b-bf76-a19fe21b2cb7",
                    "headline": "Text Pack 2",
                    "slugline": "packs",
                    "source": "sf",
                    "version": 2,
                    "state": "__no_value__",
                    "search_provider": "__no_value__"
                },
                {
                    "type": "picture",
                    "pubstatus": "usable",
                    "versioncreated": "2024-02-20T08:37:07+0000",
                    "guid": "941f41db-4444-4aaf-94d9-cd48cd091a59",
                    "headline": "Picture Pack 1",
                    "slugline": "packs",
                    "source": "sf",
                    "version": 1,
                    "state": "__no_value__",
                    "search_provider": "__no_value__"
                }
            ],
            "extra": {
                "stt_events": "259431",
                "stt_topics": "584717"
            }
        }]}
        """

    @auth
    Scenario: Test ContentAPIEventResource excludes unknown fields
        Given empty "events"
        And empty "events_capi"
        When we set capi auth token to "#subscriber_token_0._id#"
        # Create test events
        When we upload a file "bike.jpg" to "/events_files"
        When we post to "events"
        """
        [{
            "guid": "event1",
            "name": "Sports Event",
            "slugline": "sports-event",
            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
            "internal_note": "something that should NEVER be included",
            "revert_state": "draft",
            "files": ["#events_files._id#"],
            "dates": {
                "start": "2042-01-01T10:00:00+0000",
                "end": "2042-01-01T12:00:00+0000"
            }
        }]
        """
        Then we get OK response
        When we post to "/events/post"
        """
        {
            "event": "#events._id#",
            "etag": "#events._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get capi "/events/event1"
        Then we get existing resource
        """
        {
            "_id": "event1",
            "_created": "__no_value__",
            "_updated": "__no_value__",
            "original_creator": "__no_value__",
            "version_creator": "__no_value__",
            "ingest_provider": "__no_value__",
            "internal_note": "__no_value__",
            "revert_state": "__no_value__",
            "files": "__no_value__"
        }
        """


# [STT-1244]: Disabled file support for now
#    @auth
#    Scenario: Post an Event with a file attached
#        When we upload a file "bike.jpg" to "/events_files"
#        When we post to "events"
#        """
#        [{
#            "guid": "event3",
#            "name": "Sports Event with file attachment",
#            "slugline": "sports-event",
#            "anpa_category": [{"name": "Sports", "qcode": "sports"}],
#            "dates": {
#                "start": "2042-01-01T10:00:00+0000",
#                "end": "2042-01-01T12:00:00+0000"
#            },
#            "files": ["#events_files._id#"]
#        }]
#        """
#        Then we get OK response
#        When we post to "/events/post"
#        """
#        {
#            "event": "event3",
#            "etag": "#events._etag#",
#            "pubstatus": "usable"
#        }
#        """
#        Then we get OK response
#        When we set capi auth token to "#subscriber_token_0._id#"
#        When we get capi "/events/event3"
#        Then we get existing resource
#        """
#        {
#            "_id": "event3",
#            "files": [{"name": "bike.jpg", "mimetype": "image/jpeg"}],
#            "subscribers": "__no_value__"
#        }
#        """
