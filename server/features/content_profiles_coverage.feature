Feature: Coverage Content Profiles
    @auth
    Scenario: Get default Coverage profile
    Given empty "planning_types"
    When we get "/planning_types"
    Then we get existing resource
    """
    {"_items": [{
        "name": "coverage",
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
            "files": {"enabled": false},
            "no_content_linking": {"enabled": false}
        },
        "schema": {
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
            "no_content_linking": {
                "required": false,
                "type": "boolean"
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
        "_id": 1,
        "name": "coverage",
        "editor": {
            "language": {
                "enabled": true,
                "index": 1
            },
            "slugline": {"enabled": false},
            "headline": {
                "enabled": true,
                "index": 3
            }
        },
        "schema": {
            "language": {"required": true},
            "headline": {"required": true}
        }
    }]
    """
    When we get "/planning_types"
    Then we get existing resource
    """
    {"_items": [{
        "name": "coverage",
        "editor": {
            "language": {
                "enabled": true,
                "index": 1
            },
            "slugline": {
                "enabled": false,
                "index": 3
            },
            "headline": {
                "enabled": true,
                "index": 3
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
    }]}
    """
