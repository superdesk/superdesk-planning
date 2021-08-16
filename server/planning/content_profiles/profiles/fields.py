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
