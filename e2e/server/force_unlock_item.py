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

    user_id = ObjectId()
    session_id = ObjectId()

    return lock_service.unlock(original, user_id, session_id, item_type)


def init_app(app):
    blueprint(bp, app)






# from superdesk.resource import Resource
# from superdesk.metadata.utils import item_url


# class ForceUnlockItemResource(Resource):
#     endpoint_name = "e2e_unlock_planning_item"
#     url = "e2e/force_unlock/<{0}:item_id>".format(item_url)
#     schema = {
#         "type": {
#             "type": "string",
#             "required": True,
#         },
#
#     }
