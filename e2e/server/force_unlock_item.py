# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2023 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from bson import ObjectId
from quart_babel import gettext

from superdesk import blueprint
from superdesk.errors import SuperdeskApiError
from superdesk.flask import Blueprint, g
from superdesk.resource_fields import STATUS, STATUS_OK

from planning.types import AssignmentResourceModel, UnifiedPlanningResource
from planning.locks.unlock import unlock_item


bp = Blueprint("e2e_force_unlock", __name__)

RESOURCE_MODELS = {
    "events": UnifiedPlanningResource,
    "planning": UnifiedPlanningResource,
    "assignments": AssignmentResourceModel,
}


@bp.route("/e2e/force_unlock/<item_type>/<item_id>", methods=["DELETE"])
async def force_unlock_item(item_type, item_id):
    resource_model = RESOURCE_MODELS.get(item_type)
    if resource_model is None:
        raise SuperdeskApiError.badRequestError(gettext("Unknown item type"))

    item = await resource_model.get_service().find_by_id(item_id)
    if item is None:
        raise SuperdeskApiError.notFoundError(gettext("Item not found"))

    # Mocked administrator and session: never checked against real users, they only end up in the unlock
    # notification, which is how the client tells a foreign unlock from its own
    g.user = {"_id": ObjectId(), "user_type": "administrator"}
    g.auth = {"_id": ObjectId()}
    await unlock_item(item)

    return {STATUS: STATUS_OK}


def init_app(app):
    blueprint(bp, app)
