Feature: Planning Types

    @auth
    Scenario: Get Default Planning Types
      Given empty "planning_types"
      When we get "/planning_types"
      Then we get existing resource
      """
      { "_items": [{ "name": "event", "editor": {
          "slugline": {"enabled": true}},"schema": {
          "slugline": {"minlength": null, "required": false, "type": "string", "maxlength": null}}
      }
      ,{ "name": "planning", "editor": {
          "slugline": {"enabled": true}}
       }]}
      """

    @auth
    Scenario: Get Overridden Planning Types
      Given "planning_types"
      """
      [{
        "_id": 1,
        "name": "planning",
        "editor": {"slugline": {"enabled": false}},
        "schema": {}
      }]
      """
      When we get "/planning_types"
      Then we get existing resource
      """
      { "_items": [{ "name": "event", "editor": {
          "slugline": {"enabled": true}}
       },{ "name": "planning", "editor": {
          "slugline": {"enabled": false}}
       }]}
      """

    @auth
    Scenario: Merges schema with preference to database values
      Given empty "planning_types"
      When we get "/planning_types"
      Then we get existing resource
      """
      { "_items": [
        {
          "editor":
          {
            "anpa_category": {
              "enabled": true
            },
            "calendars": {
              "enabled": true
            },
            "contacts": {
              "enabled": true
            },
            "dates": {
              "default_duration_on_change": 1,
              "enabled": true
            },
            "definition_long": {
              "enabled": true
            },
            "definition_short": {
              "enabled": true
            },
            "files": {
              "enabled": true
            },
            "internal_note": {
              "enabled": true
            },
            "links": {
              "enabled": true
            },
            "location": {
              "enabled": true
            },
            "name": {
              "enabled": true
            },
            "occur_status": {
              "enabled": true
            },
            "place": {
              "enabled": false
            },
            "slugline": {
              "enabled": true
            },
            "subject": {
              "enabled": true
            }
          },
          "name": "event",
          "schema":
          {
            "anpa_category": {
              "schema": null,
              "type": "list"
            },
            "calendars": {
              "required": false,
              "type": "list"
            },
            "contacts": {
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
            "files": {
              "required": false,
              "type": "list"
            },
            "internal_note": {
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
            "slugline": {
              "required": false,
              "type": "string"
            },
            "subject": {
              "required": false,
              "type": "list"
            }
          }
        },
        {
          "editor":
          {
            "agendas": {
              "enabled": true
            },
            "anpa_category": {
              "enabled": true
            },
            "description_text": {
              "enabled": true
            },
            "ednote": {
              "enabled": true
            },
            "flags": {
              "enabled": true
            },
            "internal_note": {
              "enabled": true
            },
            "place": {
              "enabled": false
            },
            "planning_date": {
              "enabled": true
            },
            "slugline": {
              "enabled": true
            },
            "subject": {
              "enabled": true
            },
            "urgency": {
              "enabled": true
            }
          },
          "name": "planning",
          "schema":
          {
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
            "flags": {
              "required": false,
              "type": "dict"
            },
            "headline": {
              "required": false,
              "type": "string"
            },
            "internal_note": {
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
            }
          }
        },
        {
          "editor":
          {
            "ednote": {
              "enabled": true
            },
            "g2_content_type": {
              "enabled": true
            },
            "genre": {
              "enabled": true
            },
            "internal_note": {
              "enabled": true
            },
            "keyword": {
              "enabled": false
            },
            "news_coverage_status": {
              "enabled": true
            },
            "scheduled": {
              "enabled": true
            },
            "slugline": {
              "enabled": true
            }
          },
          "name": "coverage",
          "schema":
          {
            "ednote": {
              "required": false,
              "type": "string"
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
            "news_coverage_status": {
              "required": false,
              "type": "list"
            },
            "slugline": {
              "required": false,
              "type": "string"
            }
          }
        }]
      }
      """
      Given "planning_types"
      """
      [{
          "_id": 1,
          "name": "coverage",
          "editor": {
            "slugline": {"enabled": false},
            "scheduled": {"enabled": true}
          },
          "schema": {
              "ednote": {"required": true, "type": "string"},
              "scheduled": {"required": true, "type": "datetime"}
          }
      }]
      """
      When we get "/planning_types"
      Then we get existing resource
      """
      { "_items": [
        {
          "editor":
          {
            "anpa_category": {
              "enabled": true
            },
            "calendars": {
              "enabled": true
            },
            "contacts": {
              "enabled": true
            },
            "dates": {
              "default_duration_on_change": 1,
              "enabled": true
            },
            "definition_long": {
              "enabled": true
            },
            "definition_short": {
              "enabled": true
            },
            "files": {
              "enabled": true
            },
            "internal_note": {
              "enabled": true
            },
            "links": {
              "enabled": true
            },
            "location": {
              "enabled": true
            },
            "name": {
              "enabled": true
            },
            "occur_status": {
              "enabled": true
            },
            "place": {
              "enabled": false
            },
            "slugline": {
              "enabled": true
            },
            "subject": {
              "enabled": true
            }
          },
          "name": "event",
          "schema":
          {
            "anpa_category": {
              "schema": null,
              "type": "list"
            },
            "calendars": {
              "required": false,
              "type": "list"
            },
            "contacts": {
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
            "files": {
              "required": false,
              "type": "list"
            },
            "internal_note": {
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
            "slugline": {
              "required": false,
              "type": "string"
            },
            "subject": {
              "required": false,
              "type": "list"
            }
          }
        },
        {
          "editor":
          {
            "agendas": {
              "enabled": true
            },
            "anpa_category": {
              "enabled": true
            },
            "description_text": {
              "enabled": true
            },
            "ednote": {
              "enabled": true
            },
            "flags": {
              "enabled": true
            },
            "internal_note": {
              "enabled": true
            },
            "place": {
              "enabled": false
            },
            "planning_date": {
              "enabled": true
            },
            "slugline": {
              "enabled": true
            },
            "subject": {
              "enabled": true
            },
            "urgency": {
              "enabled": true
            }
          },
          "name": "planning",
          "schema":
          {
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
            "flags": {
              "required": false,
              "type": "dict"
            },
            "headline": {
              "required": false,
              "type": "string"
            },
            "internal_note": {
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
            }
          }
        },
        {
          "editor":
          {
            "ednote": {
              "enabled": true
            },
            "g2_content_type": {
              "enabled": true
            },
            "genre": {
              "enabled": true
            },
            "internal_note": {
              "enabled": true
            },
            "keyword": {
              "enabled": false
            },
            "news_coverage_status": {
              "enabled": true
            },
            "scheduled": {
              "enabled": true
            },
            "slugline": {
              "enabled": false
            }
          },
          "name": "coverage",
          "schema":
          {
            "ednote": {
              "required": true,
              "type": "string"
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
            "news_coverage_status": {
              "required": false,
              "type": "list"
            },
            "slugline": {
              "required": false,
              "type": "string"
            }
          }
        }]
      }
      """