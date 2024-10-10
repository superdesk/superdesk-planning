# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2023 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from enum import Enum

from flask import request, json
from eve.utils import ParsedRequest
from eve.render import send_response

from superdesk import Resource, get_resource_service, Blueprint, blueprint
from superdesk.auth.decorator import blueprint_auth

from planning.utils import get_first_related_event_id_for_planning
from planning.search.queries.elastic import ElasticQuery, field_exists


class PlanningLocksResource(Resource):
    resource_methods = ["GET"]
    item_methods = []
    endpoint_name = "planning_locks"
    allow_unknown = True


class PlanningLockRepos(Enum):
    EVENTS_AND_PLANNING = "events_and_planning"
    FEATURED_PLANNING = "featured_planning"
    ASSIGNMENTS = "assignments"


DEFAULT_REPOS = (
    f"{PlanningLockRepos.EVENTS_AND_PLANNING.value},"
    f"{PlanningLockRepos.FEATURED_PLANNING.value},"
    f"{PlanningLockRepos.ASSIGNMENTS.value}"
)

PROJECTED_FIELDS = [
    "_id",
    "type",
    "recurrence_id",
    "related_events",
    "lock_time",
    "lock_action",
    "lock_user",
    "lock_session",
]


bp = Blueprint("planning_locks", __name__)


@bp.route("/planning_locks", methods=["GET", "OPTIONS"])
@blueprint_auth()
def get_planning_locks():
    resp = _get_planning_module_locks() if request.method == "GET" else None
    return send_response(None, (resp, None, None, 200))


def _get_planning_module_locks():
    repos = (request.args.get("repos") or DEFAULT_REPOS).split(",")

    item_locks = []
    locks = {}
    for repo in repos:
        if repo == PlanningLockRepos.EVENTS_AND_PLANNING.value:
            locks.update({"event": {}, "planning": {}, "recurring": {}})
            item_locks.extend(list(_get_event_locks()))
            item_locks.extend(list(_get_planning_locks()))
        elif repo == PlanningLockRepos.FEATURED_PLANNING.value:
            locks["featured"] = None
            item_locks.extend(list(_get_planning_featured_lock()))
        elif repo == PlanningLockRepos.ASSIGNMENTS.value:
            locks["assignment"] = {}
            item_locks.extend(list(_get_assignment_locks()))

    for item in item_locks:
        if item.get("_type") == "planning_featured_lock":
            locks["featured"] = {
                "item_id": item.get("_id"),
                "item_type": item.get("_type"),
                "user": item.get("lock_user"),
                "session": item.get("lock_session"),
                "action": "featured",
                "time": item.get("lock_time"),
            }
            continue

        lock = {
            "item_id": item.get("_id"),
            "item_type": item.get("type"),
            "user": item.get("lock_user"),
            "session": item.get("lock_session"),
            "action": item.get("lock_action"),
            "time": item.get("lock_time"),
        }
        primary_event_id = get_first_related_event_id_for_planning(item, "primary")
        if item.get("recurrence_id"):
            locks["recurring"][item["recurrence_id"]] = lock
        elif primary_event_id is not None:
            locks["event"][primary_event_id] = lock
        else:
            locks[item["type"]][lock["item_id"]] = lock

    return locks


def _get_query():
    query = ElasticQuery()
    query.must.append(field_exists("lock_session"))
    req = ParsedRequest()
    req.args = {
        "source": json.dumps(
            {
                "query": query.build(),
                "size": 1000,
                "from": 0,
            },
        ),
        "projections": json.dumps(PROJECTED_FIELDS),
    }
    req.page = 1
    req.max_results = 1000

    return req


def _get_event_locks():
    return get_resource_service("events").get(req=_get_query(), lookup=None)


def _get_planning_locks():
    return get_resource_service("planning").get(req=_get_query(), lookup=None)


def _get_planning_featured_lock():
    return get_resource_service("planning_featured_lock").get(req=_get_query(), lookup=None)


def _get_assignment_locks():
    return get_resource_service("assignments").get(req=_get_query(), lookup=None)


def init_app(app):
    blueprint(bp, app)
