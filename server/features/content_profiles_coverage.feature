Feature: Coverage Content Profiles
    @auth
    Scenario: Get default Coverage profile
    Given empty "planning_types"
    When we get "/planning_types"
    Then we get existing resource
    """
    {"_items": [{
        "_id": "__no_value__",
        "name": "coverage",
        "type": "coverage",
        "content_type": "__no_value__",
        "editor": {
            "g2_content_type": {
                "enabled": true,
                "index": 1
            },
            "genre": {
                "enabled": true,
                "index": 2
            },
            "slugline": {
                "enabled": true,
                "index": 3
            },
            "ednote": {
                "enabled": true,
                "index": 4
            },
            "internal_note": {
                "enabled": true,
                "index": 5
            },
            "news_coverage_status": {
                "enabled": true,
                "index": 6
            },
            "scheduled": {
                "enabled": true,
                "index": 7
            },
            "scheduled_updates": {
                "enabled": true,
                "index": 8
            },
            "contact_info": {"enabled": false},
            "language": {"enabled": false},
            "xmp_file": {"enabled": false},
            "headline": {"enabled": false},
            "keyword": {"enabled": false},
            "files": {"enabled": false}
        },
        "schema": {
            "add_coverage_to_workflow": {
                "required": false,
                "type": "boolean"
            },
            "contact_info": {
                "required": false,
                "type": "string"
            },
            "ednote": {
                "required": false,
                "type": "string"
            },
            "files": {
                "required": false,
                "type": "list"
            },
            "g2_content_type": {
                "required": true,
                "type": "list"
            },
            "genre": {
                "required": false,
                "type": "list"
            },
            "headline": {
                "required": false,
                "type": "string"
            },
            "internal_note": {
                "required": false,
                "type": "string"
            },
            "keyword": {
                "required": false,
                "type": "list"
            },
            "language": {
                "required": false,
                "type": "string"
            },
            "news_coverage_status": {
                "required": false,
                "type": "list"
            },
            "scheduled": {
                "required": true,
                "type": "datetime"
            },
            "slugline": {
                "required": false,
                "type": "string"
            },
            "xmp_file": {
                "required": false,
                "type": "dict"
            },
            "scheduled_updates": {
                "required": false,
                "type": "list"
            }
        }
    }]}
    """

    @auth
    Scenario: Merges Coverage schema with preference to database values
    Given "planning_types"
    """
    [{
        "type": "coverage",
        "name": "coverage",
        "content_type": "text",
        "editor": {
            "language": {
                "enabled": true,
                "index": 1
            },
            "slugline": {"enabled": false},
            "headline": {
                "enabled": true,
                "index": 3
            },
            "no_content_linking": {"enabled": true}
        },
        "schema": {
            "language": {"required": true},
            "headline": {"required": true},
            "no_content_linking": {
                "required": false,
                "type": "boolean"
            }
        }
    }]
    """
    When we get "/planning_types/#planning_types._id#"
    Then we get existing resource
    """
    {
        "name": "coverage",
        "type": "coverage",
        "content_type": "text",
        "editor": {
            "language": {
                "enabled": true,
                "index": 1
            },
            "g2_content_type": {
                "enabled": true
            },
            "headline": {
                "enabled": true,
                "index": 3
            },
            "slugline": {
                "enabled": false
            }
        },
        "schema": {
            "language": {
                "type": "string",
                "required": true
            },
            "headline": {
                "type": "string",
                "required": true
            }
        }
    }
    """

    @auth
    Scenario: no_content_linking only available if PLANNING_LINK_UPDATES_TO_COVERAGES is enabled
        # Test with default values
        When we get "/planning_types"
        Then we get existing resource
        """
        {"_items": [{
            "name": "coverage",
            "type": "coverage",
            "editor": {
                "no_content_linking": "__no_value__"
            },
            "schema": {
                "no_content_linking": "__no_value__"
            }
        }]}
        """
        Given config update
        """
        {"PLANNING_LINK_UPDATES_TO_COVERAGES": true}
        """
        When we get "/planning_types"
        Then we get existing resource
        """
        {"_items": [{
            "name": "coverage",
            "type": "coverage",
            "editor": {
                "no_content_linking": {"enabled": false}
            },
            "schema": {
                "no_content_linking": {"required": false, "type": "boolean"}
            }
        }]}
        """
        # Now test with custom config
        Given config update
        """
        {"PLANNING_LINK_UPDATES_TO_COVERAGES": false}
        """
        Given "planning_types"
        """
        [{
            "type": "coverage",
            "name": "coverage",
            "editor": {
                "no_content_linking": {"enabled": true}
            },
            "schema": {
                "no_content_linking": {"required": false, "type": "boolean"}
            }
        }]
        """
        When we get "/planning_types"
        Then we get existing resource
        """
        {"_items": [{
            "name": "coverage",
            "type": "coverage",
            "editor": {
                "no_content_linking": "__no_value__"
            },
            "schema": {
                "no_content_linking": "__no_value__"
            }
        }]}
        """
        Given config update
        """
        {"PLANNING_LINK_UPDATES_TO_COVERAGES": true}
        """
        When we get "/planning_types"
        Then we get existing resource
        """
        {"_items": [{
            "name": "coverage",
            "type": "coverage",
            "editor": {
                "no_content_linking": {"enabled": true}
            },
            "schema": {
                "no_content_linking": {"required": false, "type": "boolean"}
            }
        }]}
        """

    @auth
    Scenario: Coverage profiles per type
        Given empty "planning_types"
        When we post to "planning_types"
        """
        {
            "name": "Text Coverage",
            "type": "coverage",
            "content_type": "text",
            "editor": {
                "language": {
                    "enabled": true,
                    "index": 1
                },
                "slugline": {"enabled": false},
                "headline": {
                    "enabled": true,
                    "index": 3
                },
                "no_content_linking": {"enabled": true}
            },
            "schema": {
                "language": {"required": true},
                "headline": {"required": true},
                "no_content_linking": {
                    "required": false,
                    "type": "boolean"
                }
            }
        }
        """
        Then we get new resource
        When we get "planning_types"
        Then we get list with 11 items
        """
        {"_items": [{
            "type": "coverage",
            "name": "Text Coverage",
            "content_type": "text"
        }]}
        """

    @auth
    Scenario: Validate no 2 content specific coverage profiles can have the same name
        When we post to "planning_types"
        """
        {
            "name": "Text Coverage",
            "type": "coverage",
            "content_type": "text",
            "editor": {"slugline": {"enabled": true, "index": 3}},
            "schema": {"slugline": {"required": true}}
        }
        """
        Then we get OK response
        When we post to "planning_types"
        """
        {
            "name": "Text Coverage",
            "type": "coverage",
            "content_type": "text",
            "editor": {"headline": {"enabled": true, "index": 3}},
            "schema": {"headline": {"required": true}}
        }
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"name": {"unique": "Text Coverage profile already exists with that name"}}
        }
        """

    @auth
    Scenario: Can only have 1 default coverage profile in the DB
        # Creating 2 Coverage profiles without a `content_type` should fail
        When we post to "planning_types"
        """
        {
            "name": "Default Coverage",
            "type": "coverage",
            "editor": {"slugline": {"enabled": true, "index": 3}},
            "schema": {"slugline": {"required": true}}
        }
        """
        Then we get OK response
        When we post to "planning_types"
        """
        {
            "name": "Default Coverage 2",
            "type": "coverage",
            "editor": {"headline": {"enabled": true, "index": 3}},
            "schema": {"headline": {"required": true}}
        }
        """
        Then we get error 400
        """
        {
            "_status": "ERR",
            "_issues": {"content_type": {"unique": "Only 1 default Coverage profile supported"}}
        }
        """
        # But creating 2 Event profiles without `content_type` should pass
        When we post to "planning_types"
        """
        {
            "name": "Generic Event",
            "type": "event",
            "editor": {"slugline": {"enabled": true, "index": 3}},
            "schema": {"slugline": {"required": true}}
        }
        """
        Then we get OK response
        When we post to "planning_types"
        """
        {
            "name": "Sporting Event",
            "type": "event",
            "editor": {"headline": {"enabled": true, "index": 3}},
            "schema": {"headline": {"required": true}}
        }
        """
        Then we get OK response
