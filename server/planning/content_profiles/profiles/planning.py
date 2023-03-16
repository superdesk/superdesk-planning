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

from .fields import BaseSchema, DateTimeField, subjectField, BooleanField, TextField


class PlanningSchema(BaseSchema):
    """
    The planning schema used to validate the planning form
    """

    agendas = schema.ListField()
    anpa_category = schema.ListField()
    description_text = TextField(field_type="multi_line")
    ednote = TextField(field_type="multi_line")
    files = schema.ListField()
    marked_for_not_publication = BooleanField()
    overide_auto_assign_to_workflow = BooleanField()
    headline = schema.StringField()
    internal_note = TextField(field_type="multi_line", expandable=True)
    language = schema.StringField()
    name = schema.StringField()
    place = schema.ListField()
    planning_date = DateTimeField(required=True)
    slugline = schema.StringField(required=True)
    subject = subjectField
    urgency = schema.IntegerField()
    priority = schema.IntegerField()
    custom_vocabularies = schema.ListField()
    associated_event = schema.NoneField()
    coverages = schema.ListField()


DEFAULT_PLANNING_PROFILE = {
    "name": "planning",
    "editor": {
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
        "description_text": {
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
        "custom_vocabularies": {
            "enabled": False,
            "group": "details",
            "index": 4,
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
        # Associated Event group
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
    },
    "schema": dict(PlanningSchema),  # type: ignore
    "groups": {
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
            "name": "Associated Event",
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
}
