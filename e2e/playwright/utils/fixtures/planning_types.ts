/**
 * Planning content profile used by the preview panel specs.
 *
 * The backend merges this record field-by-field into the default planning
 * profile, so every field that is enabled in the default profile must be
 * explicitly disabled (or re-grouped) here, otherwise it would still render.
 * The merge semantics live in `merge_planning_type` in
 * `server/planning/content_profiles/planning_types_async_service.py`.
 *
 * Layout under test:
 * - group "main" (plain container): description_text, slugline, priority,
 *   planning_date, internal_note; deliberately not the default field order.
 * - group "extra" (useToggleBox): anpa_category.
 * - "name" is enabled but assigned to no group, so it must not render.
 */
export const PLANNING_PROFILE_GROUPED_PREVIEW = {
    _id: 'planning',
    name: 'planning',
    editor: {
        description_text: {enabled: true, group: 'main', index: 1},
        slugline: {enabled: true, group: 'main', index: 2},
        priority: {enabled: true, group: 'main', index: 3},
        planning_date: {enabled: true, group: 'main', index: 4},
        internal_note: {enabled: true, group: 'main', index: 5},
        anpa_category: {enabled: true, group: 'extra', index: 1},
        name: {enabled: true, group: null, index: 6},
        ednote: {enabled: false},
        agendas: {enabled: false},
        subject: {enabled: false},
        urgency: {enabled: false},
        marked_for_not_publication: {enabled: false},
    },
    groups: {
        main: {
            _id: 'main',
            name: 'Main',
            index: 10,
            showBookmark: true,
            icon: 'align-left',
            useToggleBox: false,
            translations: {name: {}},
        },
        extra: {
            _id: 'extra',
            name: 'Extra',
            index: 11,
            showBookmark: true,
            icon: 'info-sign',
            useToggleBox: true,
            translations: {name: {}},
        },
    },
};

/**
 * Event content profile used by the event preview panel spec.
 * Same merge semantics as above: default enabled fields must be disabled
 * explicitly, and the default groups (attachments at 5 with a toggle box,
 * related_plannings at 7) survive the merge and provide the section order.
 *
 * Layout under test:
 * - group "main" (plain container): slugline, dates, definition_short, location.
 * - group "extra" (useToggleBox): anpa_category.
 * - files stays in the default "attachments" group, related_plannings in its
 *   default group, so attachments renders before the related plannings section.
 */
export const EVENT_PROFILE_GROUPED_PREVIEW = {
    _id: 'event',
    name: 'event',
    editor: {
        slugline: {enabled: true, group: 'main', index: 1},
        dates: {enabled: true, group: 'main', index: 2},
        definition_short: {enabled: true, group: 'main', index: 3},
        location: {enabled: true, group: 'main', index: 4},
        anpa_category: {enabled: true, group: 'extra', index: 1},
        files: {enabled: true, group: 'attachments', index: 1},
        related_plannings: {enabled: true, group: 'related_plannings', index: 1},
        recurring_rules: {enabled: false},
        name: {enabled: false},
        calendars: {enabled: false},
        occur_status: {enabled: false},
        event_contact_info: {enabled: false},
        subject: {enabled: false},
        definition_long: {enabled: false},
        internal_note: {enabled: false},
        ednote: {enabled: false},
        links: {enabled: false},
    },
    groups: {
        main: {
            _id: 'main',
            name: 'Main',
            index: 1,
            showBookmark: true,
            icon: 'align-left',
            useToggleBox: false,
            translations: {name: {}},
        },
        extra: {
            _id: 'extra',
            name: 'Extra',
            index: 2,
            showBookmark: true,
            icon: 'info-sign',
            useToggleBox: true,
            translations: {name: {}},
        },
    },
};

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