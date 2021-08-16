# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

DEFAULT_ADVANCED_SEARCH_PROFILE = {
    "name": "advanced_search",
    "editor": {
        "event": {
            # Common Fields
            "full_text": {
                "enabled": True,
                "index": 1,
                "group": "common",
                "search_enabled": False,
                "filter_enabled": True,
            },
            "name": {
                "enabled": True,
                "index": 2,
                "group": "common",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "slugline": {
                "enabled": True,
                "index": 3,
                "group": "common",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "language": {
                "enabled": False,
                "index": 4,
                "group": "common",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Vocabularies
            "anpa_category": {
                "enabled": True,
                "index": 1,
                "group": "vocabularies",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "place": {
                "enabled": False,
                "index": 2,
                "group": "vocabularies",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "subject": {
                "enabled": True,
                "index": 3,
                "group": "vocabularies",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # States
            "state": {
                "enabled": True,
                "index": 1,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "posted": {
                "enabled": True,
                "index": 2,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "spike_state": {
                "enabled": True,
                "index": 3,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "include_killed": {
                "enabled": True,
                "index": 4,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "lock_state": {
                "enabled": True,
                "index": 5,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Dates
            "start_date": {
                "enabled": True,
                "index": 1,
                "group": "dates",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "end_date": {
                "enabled": True,
                "index": 2,
                "group": "dates",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "date_filter": {
                "enabled": True,
                "index": 3,
                "group": "dates",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Events
            "no_calendar_assigned": {
                "enabled": True,
                "index": 1,
                "group": "events",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "calendars": {
                "enabled": True,
                "index": 2,
                "group": "events",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "reference": {
                "enabled": False,
                "index": 3,
                "group": "events",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "source": {
                "enabled": True,
                "index": 4,
                "group": "events",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "location": {
                "enabled": True,
                "index": 5,
                "group": "events",
                "search_enabled": True,
                "filter_enabled": True,
            },
        },
        "planning": {
            # Common Fields
            "full_text": {
                "enabled": True,
                "index": 1,
                "group": "common",
                "search_enabled": False,
                "filter_enabled": True,
            },
            "name": {
                "enabled": False,
                "index": 2,
                "group": "common",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "slugline": {
                "enabled": True,
                "index": 3,
                "group": "common",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "language": {
                "enabled": False,
                "index": 4,
                "group": "common",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Vocabularies
            "anpa_category": {
                "enabled": True,
                "index": 1,
                "group": "vocabularies",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "place": {
                "enabled": False,
                "index": 2,
                "group": "vocabularies",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "subject": {
                "enabled": True,
                "index": 3,
                "group": "vocabularies",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # States
            "state": {
                "enabled": True,
                "index": 1,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "posted": {
                "enabled": True,
                "index": 2,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "spike_state": {
                "enabled": True,
                "index": 3,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "include_killed": {
                "enabled": True,
                "index": 4,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "lock_state": {
                "enabled": True,
                "index": 5,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "exclude_rescheduled_and_cancelled": {
                "enabled": True,
                "index": 6,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Dates
            "start_date": {
                "enabled": True,
                "index": 1,
                "group": "dates",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "end_date": {
                "enabled": True,
                "index": 2,
                "group": "dates",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "date_filter": {
                "enabled": True,
                "index": 3,
                "group": "dates",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Planning
            "no_agenda_assigned": {
                "enabled": True,
                "index": 1,
                "group": "planning",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "agendas": {
                "enabled": True,
                "index": 2,
                "group": "planning",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "no_coverage": {
                "enabled": True,
                "index": 3,
                "group": "planning",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "g2_content_type": {
                "enabled": True,
                "index": 4,
                "group": "planning",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "urgency": {
                "enabled": True,
                "index": 5,
                "group": "planning",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "ad_hoc_planning": {
                "enabled": True,
                "index": 6,
                "group": "planning",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "featured": {
                "enabled": True,
                "index": 7,
                "group": "planning",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "include_scheduled_updates": {
                "enabled": True,
                "index": 8,
                "group": "planning",
                "search_enabled": True,
                "filter_enabled": True,
            },
        },
        "combined": {
            # Common Fields
            "full_text": {
                "enabled": True,
                "index": 1,
                "group": "common",
                "search_enabled": False,
                "filter_enabled": True,
            },
            "name": {
                "enabled": True,
                "index": 2,
                "group": "common",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "slugline": {
                "enabled": True,
                "index": 3,
                "group": "common",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "language": {
                "enabled": False,
                "index": 4,
                "group": "common",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Vocabularies
            "anpa_category": {
                "enabled": True,
                "index": 1,
                "group": "vocabularies",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "place": {
                "enabled": False,
                "index": 2,
                "group": "vocabularies",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "subject": {
                "enabled": True,
                "index": 3,
                "group": "vocabularies",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # States
            "state": {
                "enabled": True,
                "index": 1,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "posted": {
                "enabled": True,
                "index": 2,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "spike_state": {
                "enabled": True,
                "index": 3,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "include_killed": {
                "enabled": True,
                "index": 4,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "lock_state": {
                "enabled": True,
                "index": 5,
                "group": "states",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Dates
            "start_date": {
                "enabled": True,
                "index": 1,
                "group": "dates",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "end_date": {
                "enabled": True,
                "index": 2,
                "group": "dates",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "date_filter": {
                "enabled": True,
                "index": 3,
                "group": "dates",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Events
            "calendars": {
                "enabled": True,
                "index": 1,
                "group": "events",
                "search_enabled": True,
                "filter_enabled": True,
            },
            "reference": {
                "enabled": False,
                "index": 2,
                "group": "events",
                "search_enabled": True,
                "filter_enabled": True,
            },
            # Planning
            "agendas": {
                "enabled": True,
                "index": 1,
                "group": "planning",
                "search_enabled": True,
                "filter_enabled": True,
            },
        },
    },
    "schema": {},
}
