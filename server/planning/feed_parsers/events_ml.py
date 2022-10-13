# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013 - 2022 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from datetime import timedelta, time
import pytz
import re
import logging

from flask import current_app as app
from xml.etree.ElementTree import Element

from superdesk import get_resource_service
from eve_elastic.elastic import parse_date
from superdesk.io.feed_parsers import NewsMLTwoFeedParser
from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)
from superdesk.errors import ParserError
from superdesk.utc import local_to_utc, utc_to_local
from superdesk.text_utils import plain_text_to_html
from planning.content_profiles.utils import get_planning_schema, is_field_enabled, is_field_editor_3
from planning.common import POST_STATE

logger = logging.getLogger(__name__)


class EventsMLParser(NewsMLTwoFeedParser):
    NAME = "eventsml"
    label = "Events ML"

    # map subject qcode prefix to scheme
    # if value is None, no "scheme" is used, and name comes from qcode
    # if value is not None, <name> element is used instead of qcode
    SUBJ_QCODE_PREFIXES = {"subj": None}
    missing_voc = None

    def can_parse(self, xml: Element):
        self.root = xml
        try:
            if not xml.tag.endswith("conceptItem"):
                return False

            concept = xml.find(self.qname("concept"))
            if concept is None:
                return False

            type_node = concept.find(self.qname("type"))
            if type_node is None:
                return False

            return type_node.attrib.get("qcode", "") == "cpnat:event"
        except Exception:
            return False

    def set_missing_voc_policy(self):
        # config is not accessible during __init__, so we check it here
        if self.__class__.missing_voc is None:
            self.__class__.missing_voc = app.config.get("QCODE_MISSING_VOC", "continue")
            if self.__class__.missing_voc not in ("reject", "create", "continue"):
                logger.warning(
                    'Bad QCODE_MISSING_VOC value ({value}) using default ("continue")'.format(value=self.missing_voc)
                )
                self.__class__.missing_voc = "continue"

    def parse(self, tree: Element, provider=None):
        self.root = tree
        self.set_missing_voc_policy()

        try:
            guid = tree.attrib["guid"]

            item = {
                GUID_FIELD: guid,
                ITEM_TYPE: CONTENT_TYPE.EVENT,
                "state": CONTENT_STATE.INGESTED,
            }

            self.set_occur_status(item)
            self.parse_item_meta(tree, item)
            self.parse_content_meta(tree, item)
            self.parse_concept(tree, item)
            self.parse_event_details(tree, item)

            return [item]

        except Exception as ex:
            raise ParserError.parseMessageError(ex, provider)

    def set_occur_status(self, item):
        eocstat_map = get_resource_service("vocabularies").find_one(req=None, _id="eventoccurstatus")
        if not eocstat_map:
            logger.warning("CV 'eventoccurstatus' not found, inserting default from standard")
            item["occur_status"] = {
                "qcode": "eocstat:eos5",
                "name": "Planned, occurs certainly",
                "label": "Planned, occurs certainly",
            }
        else:
            item["occur_status"] = [
                x for x in eocstat_map.get("items", []) if x["qcode"] == "eocstat:eos5" and x.get("is_active", True)
            ][0]
            item["occur_status"].pop("is_active", None)

    def parse_item_meta(self, tree, item):
        """Parse itemMeta tag"""
        meta = tree.find(self.qname("itemMeta"))

        versioncreated_elt = meta.find(self.qname("versionCreated"))
        if versioncreated_elt is not None and versioncreated_elt.text:
            item["versioncreated"] = self.datetime(meta.find(self.qname("versionCreated")).text)

        firstcreated_elt = meta.find(self.qname("firstCreated"))
        if firstcreated_elt is not None and firstcreated_elt.text:
            item["firstcreated"] = self.datetime(firstcreated_elt.text)

        try:
            pubstatus = (meta.find(self.qname("pubStatus")).get("qcode").split(":")[1]).lower()
            item["pubstatus"] = POST_STATE.CANCELLED if pubstatus == "canceled" else pubstatus
        except (AttributeError, IndexError):
            item["pubstatus"] = POST_STATE.USABLE

    def parse_content_meta(self, tree, item):
        """Parse contentMeta tag"""

        meta = tree.find(self.qname("contentMeta"))

        try:
            item["language"] = meta.find(self.qname("language")).get("tag")
        except AttributeError:
            pass

    def get_default_event_duration(self):
        profile = get_resource_service("planning_types").find_one(req=None, name="event") or {}
        return ((profile.get("editor") or {}).get("dates") or {}).get("default_duration_on_change", 1)

    def parse_concept(self, tree, item):
        """Parse concept tag"""
        concept = tree.find(self.qname("concept"))
        item["name"] = concept.find(self.qname("name")).text

        try:
            definition = concept.find(self.qname("definition")).text or ""
            # if is_field_editor_3("event", "definition_short"):
            if is_field_editor_3("definition_short", get_planning_schema("event")):
                definition = plain_text_to_html(definition)

            item["definition_short"] = definition
        except Exception:
            pass

        try:
            item["links"] = [
                info.attrib["href"]
                for info in concept.findall(self.qname("remoteInfo"))
                if info.attrib.get("rel") == "irel:seeAlso" and info.attrib.get("contenttype") == "text/html"
            ]
        except Exception:
            pass

    def get_datetime_str(self, value: str, default_time: str, default_tz: str) -> str:
        if "T" not in value:
            # Only date supplied
            utc_datetime = local_to_utc(default_tz, parse_date(f"{value}T{default_time}"))
            return utc_to_local(default_tz, utc_datetime).isoformat()

        date_str, time_str = value.split("T")
        if time_str.upper().endswith("Z"):
            return value

        try:
            time_str, offset_1, offset_2 = re.split("([+-])", time_str)
        except ValueError:
            # Only time supplied, no offset
            utc_datetime = local_to_utc(default_tz, parse_date(f"{date_str}T{time_str}"))
            return utc_to_local(default_tz, utc_datetime).isoformat()

        return value

    def parse_event_details(self, tree, item):
        """Parse eventDetails tag"""
        concept = tree.find(self.qname("concept"))
        event_details = concept.find(self.qname("eventDetails"))

        self.parse_event_schedule(event_details.find(self.qname("dates")), item)
        self.parse_content_subject(event_details, item)
        self.parse_registration_details(event_details, item)

    def parse_event_schedule(self, dates, item):
        start_date_source = dates.find(self.qname("start")).text
        start_date_str = self.get_datetime_str(start_date_source, "00:00:00", app.config["DEFAULT_TIMEZONE"])
        start_date = parse_date(start_date_str)
        is_start_local_midnight = start_date.time() == time(0, 0, 0)

        if dates.find(self.qname("end")) is not None and dates.find(self.qname("end")).text:
            end_date = parse_date(
                self.get_datetime_str(dates.find(self.qname("end")).text, "23:59:59", app.config["DEFAULT_TIMEZONE"])
            )
        else:
            if is_start_local_midnight and "T" not in start_date_source:
                end_date = parse_date(
                    self.get_datetime_str(start_date_source, "23:59:59", app.config["DEFAULT_TIMEZONE"])
                )
            else:
                end_date = start_date + timedelta(hours=self.get_default_event_duration())

        item["dates"] = dict(
            start=start_date.astimezone(pytz.utc),
            end=end_date.astimezone(pytz.utc),
            tz=app.config["DEFAULT_TIMEZONE"],
        )

    def parse_registration_details(self, event_details, item):
        event_type = get_planning_schema("event")

        if not is_field_enabled("registration_details", event_type):
            return

        try:
            registration = event_details.find(self.qname("registration"))
            if registration is not None and registration.text:
                registration_details = registration.text
                if is_field_editor_3("registration_details", event_type):
                    registration_details = plain_text_to_html(registration_details)

                item["registration_details"] = registration_details
        except Exception:
            pass
