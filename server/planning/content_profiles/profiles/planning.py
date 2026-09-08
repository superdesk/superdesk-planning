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
from .fields import DateTimeField


class PlanningSchema(UnifiedPlanningSchema):
    """
    The planning schema used to validate the planning form
    """

    # Planning specific fields
    planning_date = DateTimeField(required=True)
    associated_event = schema.NoneField()


DEFAULT_PLANNING_PROFILE = PlanningProfileResource(
    id=DEFAULT_PROFILE_ID,
    name=PlanningProfileType.PLANNING.value,
    item_type=PlanningProfileType.PLANNING,
    editor={
        # Title group
        "language": {"enabled": False, "group": "title", "index": 1},
        "slugline": {
            "enabled": True,
            "group": "title",
            "index": 2,
        },
        "headline": {
            "enabled": False,
            "group": "title",
            "index": 3,
        },
        "name": {
            "enabled": False,
            "group": "title",
            "index": 4,
        },
        # Schedule group
        "planning_date": {
            "enabled": True,
            "group": "schedule",
            "index": 1,
        },
        # Description group
        "definition_long": {
            "enabled": True,
            "group": "description",
            "index": 1,
        },
        "internal_note": {
            "enabled": True,
            "group": "description",
            "index": 2,
        },
        "place": {
            "enabled": False,
            "group": "description",
            "index": 3,
        },
        "agendas": {
            "enabled": True,
            "group": "description",
            "index": 4,
        },
        # Details group
        "ednote": {
            "enabled": True,
            "group": "details",
            "index": 1,
        },
        "anpa_category": {
            "enabled": True,
            "group": "details",
            "index": 2,
        },
        "subject": {
            "enabled": True,
            "group": "details",
            "index": 3,
        },
        "urgency": {
            "enabled": True,
            "group": "details",
            "index": 5,
        },
        "marked_for_not_publication": {
            "enabled": True,
            "group": "details",
            "index": 6,
        },
        "overide_auto_assign_to_workflow": {
            "enabled": True,
            "group": "details",
            "index": 7,
        },
        # Attachments group
        "files": {
            "enabled": False,
            "group": "attachments",
            "index": 1,
        },
        # Related Events group
        "associated_event": {
            "enabled": True,
            "group": "associated_event",
            "index": 1,
        },
        # Coverages group
        "coverages": {
            "enabled": True,
            "group": "coverages",
            "index": 1,
        },
        "priority": {"enabled": False, "group": "details", "index": 8},
        "location": {
            "enabled": False,
            "group": "details",
        },
        "definition_short": {"enabled": False},
        "event_contact_info": {"enabled": False},
        "links": {"enabled": False},
        "reference": {"enabled": False},
        "related_items": {"enabled": False},
        "calendars": {"enabled": False},
        "registration_details": {"enabled": False},
        "invitation_details": {"enabled": False},
        "accreditation_info": {"enabled": False},
        "accreditation_deadline": {"enabled": False},
    },
    schema=dict(PlanningSchema),  # type: ignore
    groups={
        "title": {
            "_id": "title",
            "name": "Title",
            "index": 1,
            "showBookmark": True,
            "icon": "align-left",
            "useToggleBox": False,
            "translations": {
                "name": {},
            },
        },
        "schedule": {
            "_id": "schedule",
            "name": "Schedule",
            "index": 2,
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
            "index": 3,
            "showBookmark": True,
            "icon": "align-left",
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
            "useToggleBox": False,
            "translations": {
                "name": {},
            },
        },
        "associated_event": {
            "_id": "associated_event",
            "name": "Related Events",
            "index": 6,
            "showBookmark": True,
            "icon": "calendar",
            "useToggleBox": False,
            "translations": {
                "name": {},
            },
        },
        "coverages": {
            "_id": "coverages",
            "name": "Coverages",
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
