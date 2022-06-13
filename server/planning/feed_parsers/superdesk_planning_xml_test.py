from os import path
from xml.etree import ElementTree
from datetime import datetime
from dateutil.tz import tzoffset

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
                        "_id" : "newscoveragestatus",
                        "display_name" : "News Coverage Status",
                        "type" : "manageable",
                        "unique_field" : "qcode",
                        "selection_type" : "do not show",
                        "items" : [ 
                            {
                                "is_active" : True,
                                "qcode" : "ncostat:int",
                                "name" : "coverage intended",
                                "label" : "Planned"
                            }, 
                            {
                                "is_active" : True,
                                "qcode" : "ncostat:notdec",
                                "name" : "coverage not decided yet",
                                "label" : "On merit"
                            }, 
                            {
                                "is_active" : False,
                                "qcode" : "ncostat:notint",
                                "name" : "coverage not intended",
                                "label" : "Not planned"
                            }, 
                            {
                                "is_active" : True,
                                "qcode" : "ncostat:onreq",
                                "name" : "coverage upon request",
                                "label" : "On request"
                            }
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
        self.assertEqual(item["slugline"], "Miten valtiovarainministeriön ehdotuksen mukaan esimerkiksi puolustus saa lisärahoitusta?")
        self.assertEqual(item["ednote"], "Valtiovarainministeriön ehdotus toiseksi lisätalousarvioksi")
        self.assertEqual(item["coverages"][0]["coverage_id"], "ID_TEXT_120190859")
        self.assertEqual(item["coverages"][0]["planning"]["g2_content_type"], "text")