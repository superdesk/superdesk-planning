Feature: Planning Content API
    Scenario: Get all planning items
        Given "products"
        """
        [
            {   
                "_id": "5b20652a1d41c812e24aa59e",
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
                "_id": "5b20652a1d41c812e24aa49e",
                "name": "Public API",
                "subscriber_type": "digital",
                "email": "public_api@test.com",
                "is_active": true,
                "products": ["5b20652a1d41c812e24aa59e"],
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
        Given "planning_capi"
        """
        [
            {
                "slugline": "test-planning-1",
                "headline": "Test Planning 1",
                "description_text": "First test planning item",
                "planning_date": "2025-05-12T10:00:00+0000",
                "subscribers": ["#user._id#"],
                "coverages": [
                    {
                        "coverage_id": "cov1",
                        "planning": {
                            "g2_content_type": "text",
                            "slugline": "test-coverage-1"
                        }
                    }
                ]
            },
            {
                "slugline": "test-planning-2",
                "headline": "Test Planning 2",
                "description_text": "Second test planning item",
                "planning_date": "2025-05-12T10:00:00+0000",
                "subscribers": ["#user._id#"],
                "coverages": [
                    {
                        "coverage_id": "cov2",
                        "planning": {
                            "g2_content_type": "text",
                            "slugline": "test-coverage-2"
                        }
                    }
                ]
            }
        ]
        """

        When we get "/planning"
        Then we get OK response
        Then we get existing resource
            """
            {
                "_items" : [
                    {
                        "slugline": "test-planning-1",
                        "headline": "Test Planning 1",
                        "description_text": "First test planning item",
                        "planning_date": "2025-05-12T10:00:00+0000",
                        "subscribers": ["#user._id#"],
                        "coverages": [
                            {
                                "coverage_id": "cov1",
                                "planning": {
                                    "g2_content_type": "text",
                                    "slugline": "test-coverage-1"
                                }
                            }
                        ]
                    },
                        {
                        "slugline": "test-planning-2",
                        "headline": "Test Planning 2",
                        "description_text": "Second test planning item",
                        "planning_date": "2025-05-12T10:00:00+0000",
                        "subscribers": ["#user._id#"],
                        "coverages": [
                            {
                                "coverage_id": "cov2",
                                "planning": {
                                    "g2_content_type": "text",
                                    "slugline": "test-coverage-2"
                                }
                            }
                        ]
                    }
                ]
            }
            """
        When we get "/planning/#planning.0._id#"
        Then we get OK response
        Then we get existing resource
            """
            {
                "_items" : [
                    {
                        "slugline": "test-planning-1",
                        "headline": "Test Planning 1",
                        "description_text": "First test planning item",
                        "planning_date": "2025-05-12T10:00:00+0000",
                        "subscribers": ["#user._id#"],
                        "coverages": [
                            {
                                "coverage_id": "cov1",
                                "planning": {
                                    "g2_content_type": "text",
                                    "slugline": "test-coverage-1"
                                }
                            }
                        ]
                    }
                ]
            }
            """