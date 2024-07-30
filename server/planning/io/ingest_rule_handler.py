# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2022 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Dict, Any, Optional
import logging

from flask_babel import lazy_gettext
from bson import ObjectId

from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service
from superdesk.metadata.item import ITEM_TYPE, CONTENT_TYPE
from apps.rules.rule_handlers import RoutingRuleHandler, register_routing_rule_handler

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
                "calendars": [],
                "agenda": [],
            },
        },
        "schedule": {
            "day_of_week": ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
            "hour_of_day_from": None,
            "hour_of_day_to": None,
            "_allDay": True,
        },
    }

    def can_handle(self, rule: Dict[str, Any], ingest_item: Dict[str, Any], routing_scheme: Dict[str, Any]):
        return ingest_item.get(ITEM_TYPE) in [CONTENT_TYPE.EVENT, CONTENT_TYPE.PLANNING]

    def apply_rule(self, rule: Dict[str, Any], ingest_item: Dict[str, Any], routing_scheme: Dict[str, Any]):
        attributes = (rule.get("actions") or {}).get("extra") or {}
        if not attributes:
            # No need to continue if none of the action attributes are set
            return

        updates = None
        if ingest_item[ITEM_TYPE] == CONTENT_TYPE.EVENT:
            updates = self.add_event_calendars(ingest_item, attributes)
        elif ingest_item[ITEM_TYPE] == CONTENT_TYPE.PLANNING:
            updates = self.add_planning_agendas(ingest_item, attributes)

        if updates is not None:
            ingest_item.update(updates)

        if attributes.get("autopost", False):
            self.process_autopost(ingest_item)

    def _is_original_posted(self, ingest_item: Dict[str, Any]):
        service = get_resource_service("events" if ingest_item[ITEM_TYPE] == CONTENT_TYPE.EVENT else "planning")
        original = service.find_one(req=None, _id=ingest_item.get(ID_FIELD))

        return original is not None and original.get("pubstatus") in [POST_STATE.USABLE, POST_STATE.CANCELLED]

    def add_event_calendars(self, ingest_item: Dict[str, Any], attributes: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add Event Calendars from Routing Rule Action onto the ingested item"""

        ingest_item.setdefault("calendars", [])
        attributes.setdefault("calendars", [])

        if not len(attributes["calendars"]):
            # No need to continue if we're not adding any calendar(s)
            return None

        calendars = get_resource_service("vocabularies").find_one(req=None, _id="event_calendars")
        current_calendar_qcodes = [calendar["qcode"] for calendar in ingest_item["calendars"]]
        calendars_to_add = [
            calendar
            for calendar in calendars.get("items", [])
            if (
                calendar.get("is_active")
                and calendar["qcode"] not in current_calendar_qcodes
                and calendar["qcode"] in attributes["calendars"]
            )
        ]

        if not len(calendars_to_add):
            # No need to continue, as there are no new calendars to add
            return None

        updates = {"calendars": ingest_item["calendars"] + calendars_to_add}
        updated_item = get_resource_service("events").patch(ingest_item.get(ID_FIELD), updates)
        updates["_etag"] = updated_item["_etag"]

        return updates

    def add_planning_agendas(self, ingest_item: Dict[str, Any], attributes: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add Planning Agendas from Routing Rule Action onto the ingested item"""

        ingest_item.setdefault("agendas", [])
        attributes.setdefault("agendas", [])

        if not len(attributes["agendas"]):
            # No need to continue if we're not adding any agenda(s)
            return None

        requested_agenda_ids = [
            ObjectId(agenda_id)
            for agenda_id in attributes["agendas"]
            if ObjectId.is_valid(agenda_id) and ObjectId(agenda_id) not in ingest_item["agendas"]
        ]

        if not len(requested_agenda_ids):
            # No need to continued, as there are no new agenda(s) to add
            return None

        # Get the active agendas from the DB
        agendas = get_resource_service("agenda").get(
            req=None,
            lookup={
                ID_FIELD: {"$in": requested_agenda_ids},
                "is_enabled": True,
            },
        )

        new_agenda_ids = [agenda[ID_FIELD] for agenda in agendas]
        if len(requested_agenda_ids) != len(new_agenda_ids):
            missing_ids = ", ".join(
                [str(agenda_id) for agenda_id in requested_agenda_ids if agenda_id not in new_agenda_ids]
            )
            logger.warning(f"The following agendas were not found in the db: {missing_ids}")

            if not len(new_agenda_ids):
                # Again, no need to continue if there are no agenda(s) to add
                return None

        # Append Agenda IDs found onto the item
        updates = {"agendas": ingest_item["agendas"] + new_agenda_ids}
        updated_item = get_resource_service("planning").patch(ingest_item.get(ID_FIELD), updates)
        updates["_etag"] = updated_item["_etag"]
        return updates

    def process_autopost(self, ingest_item: Dict[str, Any]):
        """Automatically post this item"""

        if self._is_original_posted(ingest_item):
            # No need to autopost this item
            # As the original is already posted
            # And any updates from ingest should automatically re-post this item
            return

        item_id = ingest_item.get(ID_FIELD)
        update_post_item(
            {
                "pubstatus": ingest_item.get("pubstatus") or POST_STATE.USABLE,
                "_etag": ingest_item.get("_etag"),
            },
            ingest_item,
        )
        logger.info(f"Posted item {item_id}")


register_routing_rule_handler(PlanningRoutingRuleHandler())
