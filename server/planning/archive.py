# This file is part of Superdesk.
#
# Copyright 2013, 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from copy import deepcopy
from superdesk import get_resource_service
from apps.archive.common import insert_into_versions

TEMPLATE_FIELDS_TO_OVERRIDE = [
    'anpa_category',
    'subject',
    'genre',
    'company_codes',
    'keywords',
    'authors',
    'dateline',
    'place',
    'task',
    'flags',
]


def create_item_from_template(doc, extra_fields_to_override=None):
    fields_to_override = deepcopy(TEMPLATE_FIELDS_TO_OVERRIDE)
    if extra_fields_to_override is not None:
        fields_to_override.extend(extra_fields_to_override)

    archive_service = get_resource_service('archive')

    # First post the item in it's entirety
    item_id = archive_service.post([deepcopy(doc)])[0]

    # Then calculate the fields to override
    # and apply them if any found
    updates = {
        key: val
        for key, val in doc.items()
        if key in fields_to_override
    }

    if len(updates):
        archive_service.patch(item_id, updates)

    # Finally retrieve the full item from the database
    # and insert it into versions
    item = archive_service.find_one(req=None, _id=item_id)
    insert_into_versions(doc=item)
    return item
