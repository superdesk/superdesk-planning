# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013 - 2022 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from datetime import timedelta
import logging

from flask import current_app as app
from xml.etree.ElementTree import Element

from superdesk import get_resource_service
from superdesk.io.feed_parsers import NewsMLTwoFeedParser
from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)
from superdesk.errors import ParserError
from superdesk.utc import utcnow

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

            if get_resource_service("events").find_one(req=None, guid=guid):
                logger.warning("An event already exists with exact same ID. Updating events is not supported yet")
                return []

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
            item["definition_short"] = concept.find(self.qname("definition")).text or ""
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

    def parse_event_details(self, tree, item):
        """Parse eventDetails tag"""
        concept = tree.find(self.qname("concept"))
        event_details = concept.find(self.qname("eventDetails"))

        dates = event_details.find(self.qname("dates"))
        start_date = self.datetime(dates.find(self.qname("start")).text)

        if dates.find(self.qname("end")):
            end_date = self.datetime(dates.find(self.qname("end")).text)
        else:
            end_date = start_date + timedelta(hours=self.get_default_event_duration())

        item["dates"] = dict(
            start=start_date,
            end=end_date,
            tz=app.config["DEFAULT_TIMEZONE"],
        )

        self.parse_content_subject(event_details, item)
