
import unittest
import xml.etree.ElementTree as ET
from planning.feed_parsers.ntb_event_xml import NTBEventXMLFeedParser


class NTBEventXMLFeedParserTestCase(unittest.TestCase):

    def setUp(self):
        self.xml = ET.fromstring("""<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
            <document>
            <title>this is a title</title>
            <location>test location</location>
            <timeStart>2016-09-05T09:00:00</timeStart>
            <timeEnd>2016-09-16T16:00:00</timeEnd>
            <guid>test-guid</guid>
            <geo>
            <latitude>123</latitude>
            <longitude>456</longitude>
            </geo>
            <content>this is content</content>
            </document>""")

    def test_ntb_event_xml_feed_parser_can_parse(self):
        self.assertEqual(True, NTBEventXMLFeedParser().can_parse(self.xml))

    def test_ntb_event_xml_feed_parser_parse(self):
        self.event = NTBEventXMLFeedParser().parse(self.xml)
        self.assertEqual('this is a title', self.event[0].get('name'))
        self.assertEqual('this is content', self.event[0].get('definition_long'))
        self.assertEqual([{'name': 'test location', 'qcode': '', 'geo': '123, 456'}], self.event[0].get('location'))
        self.assertEqual(
            {'end': '2016-09-16T16:00:00', 'tz': '', 'start': '2016-09-05T09:00:00', 'recurring_rule': {}},
            self.event[0].get('dates'))
