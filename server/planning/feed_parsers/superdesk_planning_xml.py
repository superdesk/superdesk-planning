from cgitb import text
from datetime import date
import logging
from superdesk.io.feed_parsers import NewsMLTwoFeedParser
import pytz
from xml.etree.ElementTree import Element
from flask import current_app as app
from superdesk import get_resource_service
from superdesk.metadata.item import (
    ITEM_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)
from superdesk.errors import ParserError

utc = pytz.UTC
logger = logging.getLogger(__name__)


class PlanningXmlFeedParser(NewsMLTwoFeedParser):
    """Superdesk event specific parser.

    Feed Parser which can parse the Superdesk Planing feed and convert to internal Planning format,
    but the firstcreated and versioncreated times are localised.
    """

    NAME = "Xml_planning"
    label = "Xml Planning"

    # map subject qcode prefix to scheme
    # if value is None, no "scheme" is used, and name comes from qcode
    # if value is not None, <name> element is used instead of qcode
    SUBJ_QCODE_PREFIXES = {"subj": None}
    missing_voc = None

    def can_parse(self, xml: Element):
        self.root = xml
        try:
            if not xml.tag.endswith("planningItem"):
                return False

            item_meta = xml.find(self.qname("itemMeta"))
            if item_meta is None:
                return False

            itemClass_node = item_meta.find(self.qname("itemClass"))
            if itemClass_node is None:
                return False

            return itemClass_node.attrib.get("qcode", "") == "plinat:newscoverage"
        except Exception:
            return False

    def parse(self, tree: Element, provider=None):
        self.root = tree

        try:
            guid = tree.attrib["guid"]
            item = {
                GUID_FIELD: guid,
                ITEM_TYPE: "planning",
                "state": CONTENT_STATE.INGESTED,
                "_type": "planning",
                "_id": guid,
            }

            self.parse_item_meta(tree, item)
            self.parse_content_meta(tree, item)
            self.parse_news_coverage_set(tree, item)
            return [item]

        except Exception as ex:
            raise ParserError.parseMessageError(ex, provider)

    def parse_item_meta(self, tree, item):
        """Parse itemMeta tag"""
        meta = tree.find(self.qname("itemMeta"))

        versioncreated_elt = meta.find(self.qname("versionCreated"))
        if versioncreated_elt is not None and versioncreated_elt.text:
            item["versioncreated"] = self.datetime(meta.find(self.qname("versionCreated")).text)
        item_class_elt = meta.find(self.qname("itemClass"))
        if item_class_elt is not None:
            item["item_class"] = item_class_elt.get("qcode")

    def parse_content_meta(self, tree, item):
        """Parse contentMeta tag"""

        content_meta = tree.find(self.qname("contentMeta"))
        # subjects
        self.parse_content_subject(content_meta, item)

        firstcreated_elt = content_meta.find(self.qname("contentCreated"))
        if firstcreated_elt is not None and firstcreated_elt.text:
            item["firstcreated"] = firstcreated_elt.text

        updated_elt = content_meta.find(self.qname("contentModified"))
        if updated_elt is not None and updated_elt.text:
            item["_updated"] = updated_elt.text

        slugline_elt = content_meta.find(self.qname("headline"))
        if slugline_elt is not None and slugline_elt.text:
            item["slugline"] = slugline_elt.text

        description_elt = content_meta.find(self.qname("description"))
        if description_elt is not None and description_elt.text:
            item["description_text"] = description_elt.text

    def parse_news_coverage_set(self, tree, item):
        """Parse newsCoverageSet tag"""
        val = {}
        news_coverage_set = tree.find(self.qname("newsCoverageSet"))
        if news_coverage_set:
            news_coverage_elt = news_coverage_set.find(self.qname("newsCoverage"))
            val["coverage_id"] = news_coverage_elt.get("id")
            val["firstcreated"] = news_coverage_elt.get("modified")

        planning_elt = news_coverage_elt.find(self.qname("planning"))
        if planning_elt is not None:
            headline_elt = planning_elt.find(self.qname("headline"))
            content_elt = planning_elt.find(self.qname("g2contentType"))
            val["planning"] = {"slugline": headline_elt.text, "g2_content_type": content_elt.text}
            item["coverages"] = val
