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
from superdesk import Blueprint, blueprint, get_resource_service
from planning.item_lock import LockService
from apps.common.components.utils import get_component


bp = Blueprint("e2e_force_unlock", __name__)


@bp.route("/e2e/force_unlock/<item_type>/<item_id>", methods=["DELETE"])
def force_unlock_item(item_type, item_id):
    original = get_resource_service(item_type).find_one(req=None, _id=item_id)
    lock_service = get_component(LockService)

    # We can use mocked IDs here, as we aren't actually checking these against real users
    # merely just sending them througn the websocket notifications
    user_id = ObjectId()
    session_id = ObjectId()

    return lock_service.unlock(original, user_id, session_id, item_type)


def init_app(app):
    blueprint(bp, app)
