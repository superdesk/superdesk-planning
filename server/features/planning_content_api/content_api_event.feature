Feature: Content API Event Resource
    @auth
    Scenario: Get all planning items
        Given "products"
        """
        [
            {
                "name": "prod-1",
                "codes": "abc,xyz",
                "product_type": "both"
            }
        ]
        """
        Given "subscribers"
        """
        [
            {
                "_id": "#user._id#",
                "name": "Public API",
                "subscriber_type": "digital",
                "email": "public_api@test.com",
                "is_active": true,
                "products": ["#products._id#"],
                "destinations": [
                    {
                        "delivery_type": "http_push",
                        "format": "ninjs",
                        "name": "HTTP Push",
                        "config": {
                            "resource_url": "http://localhost:5050/publish",
                            "assets_url": "http://localhost:5050/assets",
                            "packaged": "true"
                        }
                    }
                ]
            }
        ]
        """
        Given "events_capi"
        """
        [
            {
                "name": "Test Event 1",
                "slugline": "test-event-1",
                "definition_short": "First test event item",
                "dates": {
                    "start": "2025-05-12T08:00:00+0000",
                    "end": "2025-05-12T10:00:00+0000"
                },
                "subscribers": ["#user._id#"]
            },
            {
                "name": "Test Event 2",
                "slugline": "test-event-2",
                "definition_short": "Second test event item",
                "dates": {
                    "start": "2025-05-12T11:00:00+0000",
                    "end": "2025-05-12T12:30:00+0000"
                },
                "subscribers": ["#user._id#"]
            }
        ]
        """
        When we get "/event"
        Then we get OK response
        Then we get existing resource
            """
            {
                "_items" : [
                    {
                        "name": "Test Event 1",
                        "slugline": "test-event-1",
                        "definition_short": "First test event item",
                        "dates": {
                            "start": "2025-05-12T08:00:00+0000",
                            "end": "2025-05-12T10:00:00+0000"
                        },
                        "subscribers": ["#user._id#"]
                    },
                    {
                        "name": "Test Event 2",
                        "slugline": "test-event-2",
                        "definition_short": "Second test event item",
                        "dates": {
                            "start": "2025-05-12T11:00:00+0000",
                            "end": "2025-05-12T12:30:00+0000"
                        },
                        "subscribers": ["#user._id#"]
                    }
                ]
            }
            """
        When we get "/event/#event.0._id#"
        Then we get OK response
        Then we get existing resource
            """
            {
                "_items" : [
                    {
                        "name": "Test Event 1",
                        "slugline": "test-event-1",
                        "definition_short": "First test event item",
                        "dates": {
                            "start": "2025-05-12T08:00:00+0000",
                            "end": "2025-05-12T10:00:00+0000"
                        },
                        "subscribers": ["#subscribers._id#"]
                    }
                ]
            }
            """


