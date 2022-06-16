# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2022 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging

from eve.utils import config
from flask_babel import lazy_gettext

from superdesk.metadata.item import ITEM_TYPE
from apps.rules.rule_handlers import RoutingRuleHandler, register_routing_rule_handler

from planning.search.eventsplanning_filters import ITEM_TYPES
from planning.common import POST_STATE, update_post_item

logger = logging.getLogger(__name__)


class PlanningRoutingRuleHandler(RoutingRuleHandler):
    ID = "planning_publish"
    NAME = lazy_gettext("Autopost Planning")
    supported_actions = {
        "fetch_to_desk": False,
        "publish_from_desk": False,
    }
    supported_configs = {
        "exit": True,
        "preserve_desk": False,
    }
    default_values = {
        "name": "",
        "handler": "planning_publish",
        "filter": None,
        "actions": {
            "fetch": [],
            "publish": [],
            "exit": False,
            "extra": {
                "autopost": True,
            },
        },
        "schedule": {
            "day_of_week": ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
            "hour_of_day_from": None,
            "hour_of_day_to": None,
            "_allDay": True,
        },
    }

    def can_handle(self, rule, ingest_item, routing_scheme):
        return ingest_item.get(ITEM_TYPE) in [ITEM_TYPES.EVENT, ITEM_TYPES.PLANNING]

    def apply_rule(self, rule, ingest_item, routing_scheme):
        if rule.get("actions", {}).get("extra", {}).get("autopost"):
            logger.info(ingest_item)
            item_id = ingest_item.get(config.ID_FIELD)
            logger.info(f"Posting item {item_id}")
            update_post_item(
                {
                    "pubstatus": ingest_item.get("pubstatus") or POST_STATE.USABLE,
                    "_etag": ingest_item.get("_etag"),
                },
                ingest_item,
            )
            logger.info(f"Posted item {item_id}")


register_routing_rule_handler(PlanningRoutingRuleHandler())
