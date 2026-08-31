Feature: Event Content Profiles
    @auth
    Scenario: Get default Event profile
    Given empty "planning_types"
    When we get "/planning_types"
    Then we get existing resource
    """
    {"_items": [{
        "name": "event",
        "type": "event",
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
            },
            "registration_details": {"enabled": false},
            "invitation_details": {"enabled": false},
            "accreditation_info": {"enabled": false},
            "accreditation_deadline": {"enabled": false},
            "marked_for_not_publication": {"enabled": false},
            "overide_auto_assign_to_workflow": {"enabled": false},
            "headline": {"enabled": false},
            "coverages": {"enabled": false},
            "agendas": {"enabled": false},
            "priority": {
                "enabled": false,
                "group": "description",
                "index": 9
            },
            "urgency": {
                "enabled": false,
                "group": "description",
                "index": 10
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
                "type": "string",
                "field_type": "multi_line"
            },
            "definition_short": {
                "required": false,
                "type": "string",
                "field_type": "multi_line"
            },
            "ednote": {
                "required": false,
                "type": "string",
                "field_type": "multi_line"
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
                "type": "string",
                "field_type": "multi_line"
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
                "type": "list"
            },
            "name": {
                "required": true,
                "type": "string",
                "field_type": "single_line"
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
                "type": "list",
                "cancel_plan_with_event": true,
                "planning_auto_publish": false,
                "read_only": false
            },
            "registration_details": {
              "field_type": "multi_line",
              "required": false,
              "type": "string"
            },
            "invitation_details": {
              "field_type": "multi_line",
              "required": false,
              "type": "string"
            },
            "accreditation_info": {
              "field_type": "single_line",
              "required": false,
              "type": "string"
            },
            "accreditation_deadline": {
              "required": false,
              "type": "string"
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
            "coverages": {
              "required": false,
              "type": "list"
            },
            "agendas": {
              "required": false,
              "type": "list"
            },
            "priority": {
                "type": "integer",
                "required": false
            },
            "urgency": {
                "type": "integer",
                "required": false
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
                "useToggleBox": true,
                "translations": {"name": {}}
            },
            "links": {
                "_id": "links",
                "name": "Links",
                "index": 6,
                "showBookmark": true,
                "icon": "link",
                "useToggleBox": true,
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
        "name": "event",
        "type": "event",
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
        "type": "event",
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

    @auth
    Scenario: Add custom CV
    Given "vocabularies"
    """
    [
        {"_id": "custom", "field_type": null, "type": "manageable", "service": {"all": 1}}
    ]
    """

    When we post to "planning_types"
    """
    [{
        "name": "Event with Custom Field",
        "type": "event",
        "editor": {
            "custom": {"enabled": true}
        },
        "schema": {
            "custom": {"required": true, "type": "list"}
        }
    }]
    """
    Then we get OK response

    When we get "/planning_types/#planning_types._id#"
    Then we get existing resource
    """
    {
        "name": "Event with Custom Field",
        "type": "event",
        "editor": {
            "custom": {"enabled": true}
        },
        "schema": {
            "custom": {"required": true, "type": "list"}
        }
    }
    """
 
