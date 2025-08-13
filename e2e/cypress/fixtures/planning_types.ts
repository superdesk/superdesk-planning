export const ADVANCED_SEARCH = {
    "_id": "advanced_search",
    "name": "advanced_search",
    "init_version": 3,
    "editor": {
        "event": {
            "full_text": {
                "enabled": true,
                "index": 1,
                "group": "common",
                "search_enabled": false,
                "filter_enabled": true
            },
            "name": {
                "enabled": true,
                "index": 2,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "slugline": {
                "enabled": true,
                "index": 3,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "language": {
                "enabled": false,
                "index": 4,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "internal_note": {
                "enabled": true,
                "index": 5,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "state": {
                "enabled": true,
                "index": 1,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "posted": {
                "enabled": true,
                "index": 2,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "spike_state": {
                "enabled": true,
                "index": 3,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "include_killed": {
                "enabled": true,
                "index": 4,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "lock_state": {
                "enabled": true,
                "index": 5,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "source": {
                "enabled": true,
                "index": 6,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "start_date": {
                "enabled": true,
                "index": 1,
                "group": "dates",
                "search_enabled": true,
                "filter_enabled": true
            },
            "end_date": {
                "enabled": true,
                "index": 2,
                "group": "dates",
                "search_enabled": true,
                "filter_enabled": true
            },
            "date_filter": {
                "enabled": true,
                "index": 3,
                "group": "dates",
                "search_enabled": true,
                "filter_enabled": true
            },
            "no_calendar_assigned": {
                "enabled": true,
                "index": 1,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "calendars": {
                "enabled": true,
                "index": 2,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "reference": {
                "enabled": true,
                "index": 3,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "location": {
                "enabled": true,
                "index": 4,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "event_types": {
              "enabled": true,
              "index": 5,
              "group": "events",
              "search_enabled": true,
              "filter_enabled": true
            },
            "invitation_details": {
              "enabled": true,
              "index": 6,
              "group": "events",
              "search_enabled": true,
              "filter_enabled": true
            },
            "definition_short": {
                "enabled": true,
                "index": 7,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "definition_long": {
                "enabled": true,
                "index": 8,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "registration_details": {
                "enabled": true,
                "index": 9,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "accreditation_info": {
                "enabled": true,
                "index": 10,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "registration": {
                "enabled": true,
                "index": 11,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            }
        },
        "planning": {
            "full_text": {
                "enabled": true,
                "index": 1,
                "group": "common",
                "search_enabled": false,
                "filter_enabled": true
            },
            "name": {
                "enabled": true,
                "index": 2,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "slugline": {
                "enabled": true,
                "index": 3,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "language": {
                "enabled": false,
                "index": 4,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "internal_note": {
                "enabled": true,
                "index": 5,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "ednote": {
                "enabled": true,
                "index": 6,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "state": {
                "enabled": true,
                "index": 1,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "posted": {
                "enabled": true,
                "index": 2,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "spike_state": {
                "enabled": true,
                "index": 3,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "include_killed": {
                "enabled": true,
                "index": 4,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "lock_state": {
                "enabled": true,
                "index": 5,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "exclude_rescheduled_and_cancelled": {
                "enabled": true,
                "index": 6,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "source": {
                "enabled": true,
                "index": 7,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "start_date": {
                "enabled": true,
                "index": 1,
                "group": "dates",
                "search_enabled": true,
                "filter_enabled": true
            },
            "end_date": {
                "enabled": true,
                "index": 2,
                "group": "dates",
                "search_enabled": true,
                "filter_enabled": true
            },
            "date_filter": {
                "enabled": true,
                "index": 3,
                "group": "dates",
                "search_enabled": true,
                "filter_enabled": true
            },
            "no_agenda_assigned": {
                "enabled": true,
                "index": 1,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "agendas": {
                "enabled": true,
                "index": 2,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "no_coverage": {
                "enabled": true,
                "index": 3,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "g2_content_type": {
                "enabled": true,
                "index": 4,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "urgency": {
                "enabled": true,
                "index": 5,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "coverage_assignment_status": {
                "enabled": true,
                "index": 6,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "ad_hoc_planning": {
                "enabled": false,
                "index": 6,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "featured": {
                "enabled": true,
                "index": 7,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "include_scheduled_updates": {
                "enabled": false,
                "index": 8,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "event_types": {
              "enabled": true,
              "index": 9,
              "group": "planning",
              "search_enabled": true,
              "filter_enabled": true
            },
            "description_text": {
                "enabled": true,
                "index": 10,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "headline": {
                "enabled": true,
                "index": 11,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
        },
        "combined": {
            "full_text": {
                "enabled": true,
                "index": 1,
                "group": "common",
                "search_enabled": false,
                "filter_enabled": true
            },
            "name": {
                "enabled": true,
                "index": 2,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "slugline": {
                "enabled": true,
                "index": 3,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "language": {
                "enabled": false,
                "index": 4,
                "group": "common",
                "search_enabled": true,
                "filter_enabled": true
            },
            "state": {
                "enabled": true,
                "index": 1,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "posted": {
                "enabled": true,
                "index": 2,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "spike_state": {
                "enabled": true,
                "index": 3,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "include_killed": {
                "enabled": true,
                "index": 4,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "lock_state": {
                "enabled": true,
                "index": 5,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "source": {
                "enabled": true,
                "index": 6,
                "group": "states",
                "search_enabled": true,
                "filter_enabled": true
            },
            "start_date": {
                "enabled": true,
                "index": 1,
                "group": "dates",
                "search_enabled": true,
                "filter_enabled": true
            },
            "end_date": {
                "enabled": true,
                "index": 2,
                "group": "dates",
                "search_enabled": true,
                "filter_enabled": true
            },
            "date_filter": {
                "enabled": true,
                "index": 3,
                "group": "dates",
                "search_enabled": true,
                "filter_enabled": true
            },
            "calendars": {
                "enabled": true,
                "index": 1,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "reference": {
                "enabled": false,
                "index": 2,
                "group": "events",
                "search_enabled": true,
                "filter_enabled": true
            },
            "agendas": {
                "enabled": true,
                "index": 1,
                "group": "planning",
                "search_enabled": true,
                "filter_enabled": true
            },
            "event_types": {
              "enabled": true,
              "index": 5,
              "group": "common",
              "search_enabled": true,
              "filter_enabled": true
            }
        }
    },
    "schema": {}
}