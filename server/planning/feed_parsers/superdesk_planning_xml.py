from typing import Optional
import logging
from eve.utils import config
from flask import current_app as app

from superdesk import get_resource_service
from superdesk.io.feed_parsers import NewsMLTwoFeedParser
import pytz
from xml.etree.ElementTree import Element
from superdesk.metadata.item import (
    CONTENT_TYPE,
    ITEM_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)
from superdesk.utc import utcnow, utc_to_local
from superdesk.errors import ParserError

from planning.types import Planning
from planning.common import (
    get_coverage_status_from_cv,
    get_coverage_from_planning,
    get_default_coverage_status_qcode_on_ingest,
    WORKFLOW_STATE,
    POST_STATE,
)

from planning.content_profiles.utils import get_planning_schema
from .utils import upgrade_rich_text_fields

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

    def set_missing_voc_policy(self):
        # config is not accessible during __init__, so we check it here
        if self.__class__.missing_voc is None:
            self.__class__.missing_voc = app.config.get("QCODE_MISSING_VOC", "continue")
            if self.__class__.missing_voc not in ("reject", "create", "continue"):
                logger.warning(
                    'Bad QCODE_MISSING_VOC value ({value}) using default ("continue")'.format(value=self.missing_voc)
                )
                self.__class__.missing_voc = "continue"

    def get_item_id(self, tree: Element) -> str:
        return tree.attrib["guid"]

    def parse(self, tree: Element, provider=None):
        self.root = tree
        self.set_missing_voc_policy()
        planning_service = get_resource_service("planning")

        try:
            guid = self.get_item_id(tree)
            original: Optional[Planning] = planning_service.find_one(req=None, _id=guid)
            item = self.parse_item(tree, original)
            return [item] if item is not None else []
        except Exception as ex:
            raise ParserError.parseMessageError(ex, provider)

    def parse_item(self, tree: Element, original: Optional[Planning]) -> Optional[Planning]:
        guid = (original or {}).get("_id") or self.get_item_id(tree)
        item = {
            GUID_FIELD: guid,
            ITEM_TYPE: CONTENT_TYPE.PLANNING,
            "state": CONTENT_STATE.INGESTED,
            "_id": guid,
        }

        self.parse_item_meta(tree, item)
        self.parse_content_meta(tree, item)
        self.parse_news_coverage_set(tree, item, original)
        self.parse_news_coverage_status(tree, item)

        upgrade_rich_text_fields(item, "planning")
        for coverage in item.get("coverages") or []:
            upgrade_rich_text_fields(coverage.get("planning") or {}, "coverage")

        return item

    def parse_item_meta(self, tree, item):
        """Parse itemMeta tag

        :param tree: tree
        :param item: planning item
        """
        meta = tree.find(self.qname("itemMeta"))

        versioncreated_elt = meta.find(self.qname("versionCreated"))
        if versioncreated_elt is not None and versioncreated_elt.text:
            item["versioncreated"] = self.datetime(meta.find(self.qname("versionCreated")).text)

        editor_note = meta.find(self.qname("edNote"))
        if editor_note is not None and editor_note.text:
            item["ednote"] = editor_note.text

        item_class_elt = meta.find(self.qname("itemClass"))
        if item_class_elt is not None:
            item["item_class"] = item_class_elt.get("qcode")

        try:
            pubstatus = (meta.find(self.qname("pubStatus")).get("qcode").split(":")[1]).lower()
            item["pubstatus"] = POST_STATE.CANCELLED if pubstatus in ["canceled", POST_STATE.CANCELLED] else pubstatus
        except (AttributeError, IndexError):
            item["pubstatus"] = POST_STATE.USABLE

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

        if not item["versioncreated"]:
            updated_elt = content_meta.find(self.qname("contentModified"))
            if updated_elt is not None and updated_elt.text:
                item["versioncreated"] = self.datetime(updated_elt.text)

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
        """Parse newsCoverageStatus tag

        :param tree: tree
        :param item: planning item
        """

        # Get the ``news_coverage_status.qcode`` to use
        assert_el = tree.find(self.qname("assert"))
        ingest_status_qcode = None
        if assert_el is not None:
            news_coverage_status = assert_el.find(self.qname("newsCoverageStatus")).get("qcode")
            if news_coverage_status:
                ingest_status_qcode = news_coverage_status

        # Now assign the ``news_coverage_status`` to all coverages of this Planning item
        default_status_qcode = get_default_coverage_status_qcode_on_ingest()
        default_coverage_status = get_coverage_status_from_cv(default_status_qcode)
        default_coverage_status.pop("is_active", None)

        coverage_status = get_coverage_status_from_cv(ingest_status_qcode or default_status_qcode)
        coverage_status.pop("is_active", None)
        for coverage in item["coverages"]:
            if ingest_status_qcode is not None:
                # Status was provided by ingest, use that
                coverage["news_coverage_status"] = coverage_status
            elif coverage.get("news_coverage_status") is None:
                # Status wasn't provided in ingest, and coverage has no current value, use default instead
                coverage["news_coverage_status"] = default_coverage_status

    def parse_genre(self, planning_elt, planning):
        """Parse Genre tag

        :param planning_elt: planning element
        :param planning: coverage planning item
        """
        genre_elt = planning_elt.find(self.qname("genre"))
        if genre_elt is not None:
            genre_name = genre_elt.find(self.qname("name"))
            planning["genre"] = [{"qcode": genre_elt.get("qcode"), "name": genre_name.text}]

    def parse_coverage_planning(self, news_coverage_elt, item):
        """Map news coverage with planning

        :param news_coverage_elt: news coverage element
        """
        planning_elt = news_coverage_elt.find(self.qname("planning"))
        if planning_elt is not None:
            headline_elt = planning_elt.find(self.qname("headline"))
            content = planning_elt.find(self.qname("itemClass")).get("qcode")
            planning = {"slugline": (headline_elt.text or "").strip(), "g2_content_type": content.split(":")[1]}

            description_elt = planning_elt.find(self.qname("description"))
            if description_elt is not None and description_elt.text:
                planning["description_text"] = description_elt.text

            scheduled_elt = planning_elt.find(self.qname("scheduled"))
            if scheduled_elt is not None and scheduled_elt.text:
                planning["scheduled"] = self.datetime(scheduled_elt.text)
            else:
                # If no scheduling details are found, fallback to Planning items date
                planning["scheduled"] = item["planning_date"]

            self.parse_genre(planning_elt, planning)
            return planning

        return None

    def get_coverage_details(self, news_coverage_elt: Element, item: Planning, original: Optional[Planning]):
        """Process the Coverage element and optionally return the coverage details

        If ``None`` is returned, this coverage is not added to the Planning item
        """

        coverage_id = news_coverage_elt.get("id")
        if coverage_id is None:
            logger.warning("Unable to process coverage details, no coverage id found in ingest source")
            return None

        planning = self.parse_coverage_planning(news_coverage_elt, item)
        if planning is None:
            logger.warning(f"Failed to process coverage '{coverage_id}', planning details not found")
            return None

        modified = news_coverage_elt.get("modified")
        coverage_details = {
            "coverage_id": coverage_id,
            "workflow_status": WORKFLOW_STATE.DRAFT,
            "firstcreated": item["firstcreated"],
            "versioncreated": self.datetime(modified) if modified else item["firstcreated"],
            "planning": planning,
        }

        original_coverage = get_coverage_from_planning(original, coverage_id) if original else None
        if original_coverage is not None:
            direct_copy_fields = {
                "workflow_status",
                "news_coverage_status",
                "previous_status",
                "assigned_to",
                "flags",
                "original_creator",
                "version_creator",
            }
            for field in direct_copy_fields:
                if field in original_coverage:
                    coverage_details[field] = original_coverage[field]

        return coverage_details

    def parse_news_coverage_set(self, tree: Element, item: Planning, original: Optional[Planning]):
        """Parse newsCoverageSet tag"""

        item["coverages"] = []
        news_coverage_set = tree.find(self.qname("newsCoverageSet"))
        if news_coverage_set is not None:
            for news_coverage_elt in news_coverage_set.findall(self.qname("newsCoverage")):
                coverage = self.get_coverage_details(news_coverage_elt, item, original)
                if coverage is not None:
                    item["coverages"].append(coverage)
