# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Optional, List
from typing_extensions import Literal

import superdesk.schema as schema


class DateTimeField(schema.SchemaField):
    """Date & Time schema field."""

    def __repr__(self):
        return "datetime"

    def __init__(self, required=False, schema=None):
        """Initialize"""
        super().__init__()
        self.schema["type"] = "datetime"
        self.schema["required"] = required


class BooleanField(schema.SchemaField):
    """Boolean schema field"""

    def __repr__(self):
        return "boolean"

    def __init__(self, required=False):
        """Initialize"""
        super().__init__()
        self.schema["type"] = "boolean"
        self.schema["required"] = required


class BaseSchema(schema.Schema):
    slugline = schema.StringField()


class StringRequiredForAction(schema.SchemaField):
    def __repr__(self):
        return "string"

    def __init__(self, required=False, dependencies=None):
        """Initialize"""
        super().__init__()
        self.schema["type"] = "string"
        self.schema["required"] = required
        self.schema["dependencies"] = dependencies


TextFieldTypes = Literal["single_line", "multi_line", "editor_3"]


class TextField(schema.StringField):
    def __init__(
        self,
        required: bool = False,
        maxlength: Optional[int] = None,
        minlength: Optional[int] = None,
        field_type: TextFieldTypes = "single_line",
        expandable: Optional[bool] = None,
        format_options: Optional[List[str]] = None,
    ):
        super().__init__(required=required, maxlength=maxlength, minlength=minlength)
        self.schema["field_type"] = field_type

        if field_type == "multi_line" and expandable:
            self.schema["expandable"] = expandable
        elif field_type == "editor_3" and format_options is not None:
            self.schema["format_options"] = format_options


subjectField = schema.ListField(
    required=False,
    mandatory_in_list={"scheme": {}},
    schema={
        "type": "dict",
        "schema": {
            "name": {},
            "qcode": {},
            "scheme": {
                "type": "string",
                "required": True,
                "nullable": True,
                "allowed": [],
            },
            "service": {"nullable": True},
            "parent": {"nullable": True},
        },
    },
)
