Feature: Event Content Profiles
    @auth
    Scenario: Get default Event profile
    Given empty "planning_types"
    When we get "/planning_types"
    Then we get existing resource
    """
    {"_items": [{
        "name": "event",
        "editor": {
            "recurring_rules": {
                "enabled": true,
                "group": "schedule",
                "index": 1
            },
            "dates": {
                "enabled": true,
                "group": "schedule",
                "index": 2,
                "default_duration_on_change": 1,
                "all_day": {"enabled": true}
            },

            "language": {
                "enabled": false,
                "group": "description",
                "index": 1
            },
            "slugline": {
                "enabled": true,
                "group": "description",
                "index": 2
            },
            "name": {
                "enabled": true,
                "group": "description",
                "index": 3
            },
            "definition_short": {
                "enabled": true,
                "group": "description",
                "index": 4
            },
            "reference": {
                "enabled": false,
                "group": "description",
                "index": 5
            },
            "calendars": {
                "enabled": true,
                "group": "description",
                "index": 6
            },
            "place": {
                "enabled": false,
                "group": "description",
                "index": 7
            },
            "occur_status": {
                "enabled": true,
                "group": "description",
                "index": 8
            },

            "location": {
                "enabled": true,
                "group": "location",
                "index": 1
            },
            "event_contact_info": {
                "enabled": true,
                "group": "location",
                "index": 2
            },

            "anpa_category": {
                "enabled": true,
                "group": "details",
                "index": 1
            },
            "subject": {
                "enabled": true,
                "group": "details",
                "index": 2
            },
            "definition_long": {
                "enabled": true,
                "group": "details",
                "index": 3
            },
            "internal_note": {
                "enabled": true,
                "group": "details",
                "index": 4
            },
            "ednote": {
                "enabled": true,
                "group": "details",
                "index": 5
            },

            "files": {
                "enabled": true,
                "group": "attachments",
                "index": 1
            },

            "links": {
                "enabled": true,
                "group": "links",
                "index": 1
            },

            "related_plannings": {
                "enabled": true,
                "group": "related_plannings",
                "index": 1
            }
        },
        "schema": {
            "anpa_category": {
                "schema": null,
                "type": "list"
            },
            "calendars": {
                "required": false,
                "type": "list"
            },
            "dates": {
                "required": true,
                "type": "dict"
            },
            "definition_long": {
                "required": false,
                "type": "string"
            },
            "definition_short": {
                "required": false,
                "type": "string"
            },
            "ednote": {
                "required": false,
                "type": "string"
            },
            "event_contact_info": {
                "required": false,
                "type": "list"
            },
            "files": {
                "required": false,
                "type": "list"
            },
            "internal_note": {
                "required": false,
                "type": "string"
            },
            "language": {
                "required": false,
                "type": "string"
            },
            "links": {
                "required": false,
                "type": "list"
            },
            "location": {
                "required": false,
                "type": "string"
            },
            "name": {
                "required": true,
                "type": "string"
            },
            "occur_status": {
                "required": false,
                "type": "dict"
            },
            "place": {
                "required": false,
                "type": "list"
            },
            "recurring_rules": {
                "required": false,
                "type": "dict"
            },
            "reference": {
                "required": false,
                "type": "string"
            },
            "slugline": {
                "required": false,
                "type": "string"
            },
            "subject": {
                "required": false,
                "type": "list"
            },
            "related_plannings": {
                "required": false,
                "type": "list"
            }
        },
        "groups": {
            "schedule": {
                "_id": "schedule",
                "name": "Schedule",
                "index": 1,
                "showBookmark": true,
                "icon": "time",
                "useToggleBox": false,
                "translations": {"name": {}}
            },
            "description": {
                "_id": "description",
                "name": "Description",
                "index": 2,
                "showBookmark": true,
                "icon": "align-left",
                "useToggleBox": false,
                "translations": {"name": {}}
            },
            "location": {
                "_id": "location",
                "name": "Location",
                "index": 3,
                "showBookmark": true,
                "icon": "map-marker",
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
            "links": {
                "_id": "links",
                "name": "Links",
                "index": 6,
                "showBookmark": true,
                "icon": "link",
                "useToggleBox": false,
                "translations": {"name": {}}
            },
            "related_plannings": {
                "_id": "related_plannings",
                "name": "Related Plannings",
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
    Scenario: Merges Event schema with preference to database values
    Given "planning_types"
    """
    [{
        "_id": 1,
        "name": "event",
        "editor": {
            "language": {"enabled": true},
            "slugline": {"enabled": false}
        },
        "schema": {
            "language": {"required": true}
        }
    }]
    """
    When we get "/planning_types"
    Then we get existing resource
    """
    {"_items": [{
        "name": "event",
        "editor": {
            "language": {
                "enabled": true,
                "group": "description",
                "index": 1
            },
            "slugline": {
                "enabled": false,
                "group": "description",
                "index": 2
            }
        },
        "schema": {
            "language": {
                "type": "string",
                "required": true
            }
        }
    }]}
    """
