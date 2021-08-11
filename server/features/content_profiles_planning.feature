Feature: Planning Content Profiles
    @auth
    Scenario: Get default Planning profile
    Given empty "planning_types"
    When we get "/planning_types"
    Then we get existing resource
    """
    {"_items": [{
        "name": "planning",
        "editor": {
            "language": {
                "enabled": false,
                "group": "title",
                "index": 1
            },
            "slugline": {
                "enabled": true,
                "group": "title",
                "index": 2
            },
            "headline": {
                "enabled": false,
                "group": "title",
                "index": 3
            },
            "name": {
                "enabled": false,
                "group": "title",
                "index": 4
            },

            "planning_date": {
                "enabled": true,
                "group": "schedule",
                "index": 1
            },

            "description_text": {
                "enabled": true,
                "group": "description",
                "index": 1
            },
            "internal_note": {
                "enabled": true,
                "group": "description",
                "index": 2
            },
            "place": {
                "enabled": false,
                "group": "description",
                "index": 3
            },
            "agendas": {
                "enabled": true,
                "group": "description",
                "index": 4
            },

            "ednote": {
                "enabled": true,
                "group": "details",
                "index": 1
            },
            "anpa_category": {
                "enabled": true,
                "group": "details",
                "index": 2
            },
            "subject": {
                "enabled": true,
                "group": "details",
                "index": 3
            },
            "custom_vocabularies": {
                "enabled": false,
                "group": "details",
                "index": 4
            },
            "urgency": {
                "enabled": true,
                "group": "details",
                "index": 5
            },
            "marked_for_not_publication": {
                "enabled": true,
                "group": "details",
                "index": 6
            },
            "overide_auto_assign_to_workflow": {
                "enabled": true,
                "group": "details",
                "index": 7
            },

            "files": {
                "enabled": false,
                "group": "attachments",
                "index": 1
            },

            "associated_event": {
                "enabled": true,
                "group": "associated_event",
                "index": 1
            },

            "coverages": {
                "enabled": true,
                "group": "coverages",
                "index": 1
            }
        },
        "schema": {
            "agendas": {
                "required": false,
                "type": "list"
            },
            "anpa_category": {
                "required": false,
                "type": "list"
            },
            "description_text": {
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
            "marked_for_not_publication": {
                "required": false,
                "type": "boolean"
            },
            "overide_auto_assign_to_workflow": {
                "required": false,
                "type": "boolean"
            },
            "headline": {
                "required": false,
                "type": "string"
            },
            "internal_note": {
                "required": false,
                "type": "string"
            },
            "language": {
                "required": false,
                "type": "string"
            },
            "name": {
                "required": false,
                "type": "string"
            },
            "place": {
                "required": false,
                "type": "list"
            },
            "planning_date": {
                "required": true,
                "type": "datetime"
            },
            "slugline": {
                "required": true,
                "type": "string"
            },
            "subject": {
                "required": false,
                "type": "list"
            },
            "urgency": {
                "required": false,
                "type": "integer"
            },
            "custom_vocabularies": {
                "required": false,
                "type": "list"
            },
            "associated_event": null,
            "coverages": {
                "required": false,
                "type": "list"
            }
        },
        "groups": {
            "title": {
                "_id": "title",
                "name": "Title",
                "index": 1,
                "showBookmark": true,
                "icon": "align-left",
                "useToggleBox": false,
                "translations": {"name": {}}
            },
            "schedule": {
                "_id": "schedule",
                "name": "Schedule",
                "index": 2,
                "showBookmark": true,
                "icon": "time",
                "useToggleBox": false,
                "translations": {"name": {}}
            },
            "description": {
                "_id": "description",
                "name": "Description",
                "index": 3,
                "showBookmark": true,
                "icon": "align-left",
                "useToggleBox": false,
                "translations": {"name": {}}
            },
            "details": {
                "_id": "details",
                "name": "Details",
                "index": 4,
                "showBookmark": true,
                "icon": "info-sign",
                "useToggleBox": true,
                "translations": {"name": {}}
            },
            "attachments": {
                "_id": "attachments",
                "name": "Attachments",
                "index": 5,
                "showBookmark": true,
                "icon": "attachment",
                "useToggleBox": false,
                "translations": {"name": {}}
            },
            "associated_event": {
                "_id": "associated_event",
                "name": "Associated Event",
                "index": 6,
                "showBookmark": true,
                "icon": "calendar",
                "useToggleBox": false,
                "translations": {"name": {}}
            },
            "coverages": {
                "_id": "coverages",
                "name": "Coverages",
                "index": 7,
                "showBookmark": true,
                "icon": "calendar-list",
                "useToggleBox": false,
                "translations": {"name": {}}
            }
        }
    }]}
    """

    @auth
    Scenario: Merges Planning schema with preference to database values
    Given "planning_types"
    """
    [{
        "_id": 1,
        "name": "planning",
        "editor": {
            "language": {"enabled": true},
            "slugline": {"enabled": false},
            "headline": {"enabled": true}
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
        "name": "planning",
        "editor": {
            "language": {
                "enabled": true,
                "group": "title",
                "index": 1
            },
            "slugline": {
                "enabled": false,
                "group": "title",
                "index": 2
            },
            "headline": {
                "enabled": true,
                "group": "title",
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
