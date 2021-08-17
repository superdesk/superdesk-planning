# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


def is_field_enabled(field, planning_type):
    editor = planning_type.get("editor", {})
    return editor.get(field, {}).get("enabled", False)
