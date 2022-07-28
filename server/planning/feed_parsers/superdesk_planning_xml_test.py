from os import path
from xml.etree import ElementTree
from datetime import datetime
from dateutil.tz import tzoffset, tzutc

from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)

from planning.feed_parsers.superdesk_planning_xml import PlanningMLParser
from planning.tests import TestCase


class PlanningMLFeedParserTestCase(TestCase):
    def setUp(self):
        super(PlanningMLFeedParserTestCase, self).setUp()
        dirname = path.dirname(path.realpath(__file__))
        fixture = path.normpath(path.join(dirname, "fixtures", "planning.xml"))
        with open(fixture, "rb") as f:
            self.xml = ElementTree.parse(f)

    def _add_cvs(self):
        with self.app.app_context():
            self.app.data.insert(
                "vocabularies",
                [
                    {
                        "_id": "newscoveragestatus",
                        "display_name": "News Coverage Status",
                        "type": "manageable",
                        "unique_field": "qcode",
                        "selection_type": "do not show",
                        "items": [
                            {
                                "is_active": True,
                                "qcode": "ncostat:int",
                                "name": "coverage intended",
                                "label": "Coverage planned",
                            },
                            {
                                "is_active": True,
                                "qcode": "ncostat:notdec",
                                "name": "coverage not decided yet",
                                "label": "Coverage on merit",
                            },
                            {
                                "is_active": True,
                                "qcode": "ncostat:notint",
                                "name": "coverage not intended",
                                "label": "Coverage not planned",
                            },
                            {
                                "is_active": True,
                                "qcode": "ncostat:onreq",
                                "name": "coverage upon request",
                                "label": "Coverage on request",
                            },
                        ],
                    }
                ],
            )

    def test_can_parse(self):
        self.assertTrue(PlanningMLParser().can_parse(self.xml.getroot()))

    def test_content(self):
        self._add_cvs()
        item = PlanningMLParser().parse(self.xml.getroot(), {"name": "Test"})[0]

        self.assertEqual(item[GUID_FIELD], "urn:newsml:stt.fi:20220506:581312")
        self.assertEqual(item[ITEM_TYPE], CONTENT_TYPE.PLANNING)
        self.assertEqual(item["state"], CONTENT_STATE.INGESTED)
        self.assertEqual(item["firstcreated"], datetime(2022, 2, 16, 12, 18, 17, tzinfo=tzoffset(None, 7200)))
        self.assertEqual(item["versioncreated"], datetime(2022, 2, 16, 12, 18, 17, tzinfo=tzoffset(None, 7200)))
        self.assertEqual(item["planning_date"], datetime(2022, 5, 6, 0, 0, tzinfo=tzutc()))
        self.assertEqual(
            item["slugline"],
            "Miten valtiovarainministeriön ehdotuksen mukaan esimerkiksi puolustus saa lisärahoitusta?",
        )
        self.assertEqual(
            item["description_text"],
            "Alustatalous on Tiekartaston valmistumisen jälkeen globaalisti jatkanut nopeaa ja voimakasta kasvuaan",
        )
        self.assertEqual(item["ednote"], "Valtiovarainministeriön ehdotus toiseksi lisätalousarvioksi")

        self.assertEqual(len(item["coverages"]), 2)

        coverage = item["coverages"][0]
        self.assertEqual(coverage["coverage_id"], "ID_TEXT_120190859")
        self.assertEqual(coverage["workflow_status"], "draft")
        self.assertEqual(coverage["firstcreated"], item["firstcreated"])
        self.assertEqual(coverage["versioncreated"], datetime(2022, 5, 6, 2, 26, 27, tzinfo=tzoffset(None, 7200)))
        self.assertEqual(coverage["news_coverage_status"]["qcode"], "ncostat:int")
        self.assertEqual(coverage["news_coverage_status"]["label"], "Coverage planned")
        self.assertEqual(coverage["planning"]["g2_content_type"], "text")
        self.assertEqual(
            coverage["planning"]["slugline"],
            "Miten valtiovarainministeriön ehdotuksen mukaan esimerkiksi puolustus saa lisärahoitusta?",
        )
        self.assertEqual(coverage["planning"]["genre"][0]["qcode"], "sttgenre:1")
        self.assertEqual(coverage["planning"]["genre"][0]["name"], "Pääjuttu")
        self.assertEqual(
            coverage["planning"]["description_text"],
            "ja alustatalouden kehitystä ja näkymiä käsittelevässä tilaisuudessa julkaistaan myös tilanneraportti",
        )
        self.assertEqual(coverage["planning"]["scheduled"], datetime(2022, 5, 6, 2, 2, 55, tzinfo=tzoffset(None, 7200)))

        coverage = item["coverages"][1]
        self.assertEqual(coverage["coverage_id"], "ID_WORKREQUEST_161861")
        self.assertEqual(coverage["workflow_status"], "draft")
        self.assertEqual(coverage["firstcreated"], item["firstcreated"])
        self.assertEqual(coverage["versioncreated"], item["firstcreated"])
        self.assertEqual(coverage["news_coverage_status"]["qcode"], "ncostat:int")
        self.assertEqual(coverage["news_coverage_status"]["label"], "Coverage planned")
        self.assertEqual(coverage["planning"]["g2_content_type"], "picture")
        self.assertEqual(
            coverage["planning"]["slugline"],
            "1 VM LOGO AJASTUKSELLA // Valtiovarainministeriön ehdotus toiseksi "
            "lisätalousarvioksi lähetetään ministeriöille",
        )
        self.assertEqual(coverage["planning"]["genre"][0]["qcode"], "sttimage:28")
        self.assertEqual(coverage["planning"]["genre"][0]["name"], "Kuvituskuvaa arkistosta")
        self.assertEqual(coverage["planning"]["scheduled"], item["planning_date"])
