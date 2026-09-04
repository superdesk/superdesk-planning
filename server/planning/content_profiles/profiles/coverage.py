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
from .fields import subjectField, BaseSchema, DateTimeField, BooleanField, TextField, MultipleContentField


class CoverageSchema(BaseSchema):
    add_coverage_to_workflow = BooleanField()
    contact_info = schema.StringField()
    ednote = TextField(field_type="multi_line")
    files = schema.ListField()
    g2_content_type = schema.ListField(required=True)
    anpa_category = schema.ListField()
    genre = schema.ListField()
    headline = schema.StringField()
    internal_note = TextField(field_type="multi_line", expandable=True)
    keyword = schema.ListField()
    language = schema.StringField()
    news_coverage_status = schema.ListField()
    scheduled = DateTimeField(required=True)
    slugline = schema.StringField()
    subject = subjectField
    xmp_file = schema.DictField()
    no_content_linking = BooleanField()
    scheduled_updates = schema.ListField()
    priority = schema.IntegerField()
    multiple_content = MultipleContentField(read_only=False, default_value=False)
    location = schema.ListField()


DEFAULT_COVERAGE_PROFILE = PlanningProfileResource(
    id=DEFAULT_PROFILE_ID,
    name=PlanningProfileType.COVERAGE.value,
    item_type=PlanningProfileType.COVERAGE,
    content_type="",  # empty indicates this is the default coverage profile for all content types
    editor={
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
        "multiple_content": {
            "enabled": False,
            "index": 9,
        },
        "location": {"enabled": False},
        "anpa_category": {"enabled": False},
        "subject": {"enabled": False},
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
    schema=dict(CoverageSchema),  # type: ignore
)
