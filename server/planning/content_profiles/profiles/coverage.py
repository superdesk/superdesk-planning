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

from .fields import BaseSchema, DateTimeField, BooleanField, TextField


class CoverageSchema(BaseSchema):
    contact_info = schema.StringField()
    ednote = TextField(field_type="multi_line")
    files = schema.ListField()
    g2_content_type = schema.ListField(required=True)
    genre = schema.ListField()
    headline = schema.StringField()
    internal_note = TextField(field_type="multi_line", expandable=True)
    keyword = schema.ListField()
    language = schema.StringField()
    news_coverage_status = schema.ListField()
    scheduled = DateTimeField(required=True)
    slugline = schema.StringField()
    xmp_file = schema.DictField()
    no_content_linking = BooleanField()
    scheduled_updates = schema.ListField()
    priority = schema.IntegerField()


DEFAULT_COVERAGE_PROFILE = {
    "name": "coverage",
    "editor": {
        "g2_content_type": {
            "enabled": True,
            "index": 1,
        },
        "genre": {
            "enabled": True,
            "index": 2,
        },
        "slugline": {
            "enabled": True,
            "index": 3,
        },
        "ednote": {
            "enabled": True,
            "index": 4,
        },
        "internal_note": {
            "enabled": True,
            "index": 5,
        },
        "news_coverage_status": {
            "enabled": True,
            "index": 6,
        },
        "scheduled": {
            "enabled": True,
            "index": 7,
        },
        "scheduled_updates": {
            "enabled": True,
            "index": 8,
        },
        # Fields disabled by default
        "contact_info": {"enabled": False},
        "language": {"enabled": False},
        "xmp_file": {"enabled": False},
        "headline": {"enabled": False},
        "keyword": {"enabled": False},
        "files": {"enabled": False},
        "priority": {"enabled": False},
        # Requires `PLANNING_LINK_UPDATES_TO_COVERAGES` enabled in config
        "no_content_linking": {"enabled": False},
    },
    "schema": dict(CoverageSchema),  # type: ignore
}
