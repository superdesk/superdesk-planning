from cgitb import text
from datetime import date
import logging
from eve.utils import config
from superdesk.io.feed_parsers import NewsMLTwoFeedParser
import pytz
from xml.etree.ElementTree import Element
from flask import current_app as app
from superdesk import get_resource_service
from superdesk.metadata.item import (
    CONTENT_TYPE,
    ITEM_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)
from superdesk.utc import utcnow, utc_to_local
from superdesk.errors import ParserError

utc = pytz.UTC
logger = logging.getLogger(__name__)


class PlanningMLParser(NewsMLTwoFeedParser):
    """Superdesk event specific parser.

    Feed Parser which can parse the Superdesk Planing feed and convert to internal Planning format,
    but the firstcreated and versioncreated times are localised.
    """

    NAME = "planningml"
    label = "Planning ML"

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

            if get_resource_service("planning").find_one(req=None, guid=guid):
                logger.warning("A planning item already exists with exact same ID. Updating planning item is not supported yet")
                return []

            item = {
                GUID_FIELD: guid,
                ITEM_TYPE: CONTENT_TYPE.PLANNING,
                "state": CONTENT_STATE.INGESTED,
                "_id": guid,
            }

            self.parse_item_meta(tree, item)
            self.parse_content_meta(tree, item)
            self.parse_news_coverage_status(tree, item)
            self.parse_news_coverage_set(tree, item)
            return [item]

        except Exception as ex:
            raise ParserError.parseMessageError(ex, provider)

    def parse_item_meta(self, tree, item):
        """Parse itemMeta tag

        :param tree: tree
        :param item: planning item
        """
        meta = tree.find(self.qname("itemMeta"))

        versioncreated_elt = meta.find(self.qname("versionCreated"))
        editor_note = meta.find(self.qname("edNote"))
        item_class_elt = meta.find(self.qname("itemClass"))
        if versioncreated_elt is not None and versioncreated_elt.text:
            item["versioncreated"] = self.datetime(meta.find(self.qname("versionCreated")).text)
        if editor_note is not None and editor_note.text:
            item["ednote"] = editor_note.text
        if item_class_elt is not None:
            item["item_class"] = item_class_elt.get("qcode")

    def parse_content_meta(self, tree, item):
        """Parse contentMeta tag

        :param tree: tree
        :param item: planning item
        """
        content_meta = tree.find(self.qname("contentMeta"))
        # subjects
        self.parse_content_subject(content_meta, item)

        firstcreated_elt = content_meta.find(self.qname("contentCreated"))
        if firstcreated_elt is not None and firstcreated_elt.text:
            item["firstcreated"] = self.datetime(firstcreated_elt.text)

        updated_elt = content_meta.find(self.qname("contentModified"))
        if updated_elt is not None and updated_elt.text:
            item["_updated"] = self.datetime(updated_elt.text)

        slugline_elt = content_meta.find(self.qname("headline"))
        if slugline_elt is not None and slugline_elt.text:
            item["slugline"] = slugline_elt.text
            item["name"] = slugline_elt.text

        description_elt = content_meta.find(self.qname("description"))
        if description_elt is not None and description_elt.text:
            item["description_text"] = description_elt.text

        # Assigning the planning date from subject
        subject_elt = content_meta.find(self.qname("subject"))
        if subject_elt is not None:
            assigne_elt = subject_elt.find(self.qname("related"))
            if assigne_elt is not None:
                item["planning_date"] = self.datetime(assigne_elt.get("value"))
        else:
            item["planning_date"] = utc_to_local(config.DEFAULT_TIMEZONE, utcnow())

    def parse_news_coverage_status(self, tree, item):
        """Parse assert tag

        :param tree: tree
        :param item: planning item
        """
        assert_el = tree.find(self.qname("assert"))
        if assert_el is not None:
            news_coverage_status = assert_el.find(self.qname("newsCoverageStatus")).get("qcode")
            item["news_coverage_status"] = {
                "label": "planned",
                "name": "coverage intended",
                "qcode": news_coverage_status,
            }

    def parse_genre(self, planning_elt, planning):
        """Parse Genre tag

        :param planning_elt: planning element
        :param planning: coverage planning item
        """
        genre_elt = planning_elt.find(self.qname("genre"))
        if genre_elt is not None:
            genre_name = genre_elt.find(self.qname("name"))
            planning["genre"] = [{"qcode": genre_elt.get("qcode"), "name": genre_name.text}]

    def parse_coverage_planning(self, news_coverage_elt):
        """Map news coverage with planning

        :param news_coverage_elt: news coverage element
        """
        planning_elt = news_coverage_elt.find(self.qname("planning"))
        if planning_elt is not None:
            headline_elt = planning_elt.find(self.qname("headline"))
            content = planning_elt.find(self.qname("itemClass")).get("qcode")
            planning = {"slugline": headline_elt.text, "g2_content_type": content.split(":")[1]}

            scheduled_elt = planning_elt.find(self.qname("scheduled"))
            if scheduled_elt is not None and scheduled_elt.text:
                planning["scheduled"] = self.datetime(scheduled_elt.text)

            self.parse_genre(planning_elt, planning)
            return planning

        return {}

    def parse_news_coverage_set(self, tree, item):
        """Parse newsCoverageSet tag

        :param tree: tree
        :param item: planning item
        """
        item["coverages"] = []
        news_coverage_set = tree.find(self.qname("newsCoverageSet"))
        if news_coverage_set:
            for news_coverage_elt in news_coverage_set.findall(self.qname("newsCoverage")):
                item["coverages"].append(
                    {
                        "coverage_id": news_coverage_elt.get("id"),
                        "firstcreated": self.datetime(news_coverage_elt.get("modified")),
                        "planning": self.parse_coverage_planning(news_coverage_elt),
                    }
                )
