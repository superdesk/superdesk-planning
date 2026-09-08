# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk.schema as schema

from planning.types import PlanningProfileResource, PlanningProfileType, DEFAULT_PROFILE_ID
from .unified import UnifiedPlanningSchema


class EventSchema(UnifiedPlanningSchema):
    """
    The event schema is used for validation of the event edit form
    """

    # Event specific fields
    dates = schema.DictField(required=True)
    occur_status = schema.DictField()
    occur_status.schema["schema"] = {
        "qcode": {"type": "string", "required": True},
        "name": {"type": "string", "required": False},
        "label": {"type": "string", "required": False},
    }
    recurring_rules = schema.DictField()
    related_plannings = schema.ListField()
    related_plannings.schema["read_only"] = False
    related_plannings.schema["planning_auto_publish"] = False
    related_plannings.schema["cancel_plan_with_event"] = True


DEFAULT_EVENT_PROFILE = PlanningProfileResource(
    id=DEFAULT_PROFILE_ID,
    name=PlanningProfileType.EVENT.value,
    item_type=PlanningProfileType.EVENT,
    editor={
        # Schedule Group
        "recurring_rules": {
            "enabled": True,
            "group": "schedule",
            "index": 1,
        },
        "dates": {
            "enabled": True,
            "group": "schedule",
            "index": 2,
            "default_duration_on_change": 1,
            "all_day": {"enabled": True},
        },
        # Description Group
        "language": {
            "enabled": False,
            "group": "description",
            "index": 1,
        },
        "slugline": {
            "enabled": True,
            "group": "description",
            "index": 2,
        },
        "name": {
            "enabled": True,
            "group": "description",
            "index": 3,
        },
        "definition_short": {
            "enabled": True,
            "group": "description",
            "index": 4,
        },
        "reference": {
            "enabled": False,
            "group": "description",
            "index": 5,
        },
        "calendars": {
            "enabled": True,
            "group": "description",
            "index": 6,
        },
        "place": {
            "enabled": False,
            "group": "description",
            "index": 7,
        },
        "occur_status": {
            "enabled": True,
            "group": "description",
            "index": 8,
        },
        "priority": {
            "enabled": False,
            "group": "description",
            "index": 9,
        },
        "urgency": {
            "enabled": False,
            "group": "description",
            "index": 10,
        },
        # Location Group
        "location": {
            "enabled": True,
            "group": "location",
            "index": 1,
        },
        "event_contact_info": {
            "enabled": True,
            "group": "location",
            "index": 2,
        },
        # Details group
        "anpa_category": {
            "enabled": True,
            "group": "details",
            "index": 1,
        },
        "subject": {
            "enabled": True,
            "group": "details",
            "index": 2,
        },
        "definition_long": {
            "enabled": True,
            "group": "details",
            "index": 3,
        },
        "internal_note": {
            "enabled": True,
            "group": "details",
            "index": 4,
        },
        "ednote": {
            "enabled": True,
            "group": "details",
            "index": 5,
        },
        # Attachments group
        "files": {
            "enabled": True,
            "group": "attachments",
            "index": 1,
        },
        # Links group
        "links": {
            "enabled": True,
            "group": "links",
            "index": 1,
        },
        # Related Plannings group
        "related_plannings": {
            "enabled": True,
            "group": "related_plannings",
            "index": 1,
        },
        "registration_details": {"enabled": False},
        "invitation_details": {"enabled": False},
        "accreditation_info": {"enabled": False},
        "accreditation_deadline": {"enabled": False},
        "related_items": {"enabled": False},
        "marked_for_not_publication": {"enabled": False},
        "overide_auto_assign_to_workflow": {"enabled": False},
        "headline": {"enabled": False},
        "coverages": {"enabled": False},
        "agendas": {"enabled": False},
    },
    schema=dict(EventSchema),  # type: ignore
    groups={
        "schedule": {
            "_id": "schedule",
            "name": "Schedule",
            "index": 1,
            "showBookmark": True,
            "icon": "time",
            "useToggleBox": False,
            "translations": {
                "name": {},
            },
        },
        "description": {
            "_id": "description",
            "name": "Description",
            "index": 2,
            "showBookmark": True,
            "icon": "align-left",
            "useToggleBox": False,
            "translations": {
                "name": {},
            },
        },
        "location": {
            "_id": "location",
            "name": "Location",
            "index": 3,
            "showBookmark": True,
            "icon": "map-marker",
            "useToggleBox": False,
            "translations": {
                "name": {},
            },
        },
        "details": {
            "_id": "details",
            "name": "Details",
            "index": 4,
            "showBookmark": True,
            "icon": "info-sign",
            "useToggleBox": True,
            "translations": {
                "name": {},
            },
        },
        "attachments": {
            "_id": "attachments",
            "name": "Attachments",
            "index": 5,
            "showBookmark": True,
            "icon": "attachment",
            "useToggleBox": True,
            "translations": {
                "name": {},
            },
        },
        "links": {
            "_id": "links",
            "name": "Links",
            "index": 6,
            "showBookmark": True,
            "icon": "link",
            "useToggleBox": True,
            "translations": {
                "name": {},
            },
        },
        "related_plannings": {
            "_id": "related_plannings",
            "name": "Related Plannings",
            "index": 7,
            "showBookmark": True,
            "icon": "calendar-list",
            "useToggleBox": False,
            "translations": {
                "name": {},
            },
        },
    },
)
