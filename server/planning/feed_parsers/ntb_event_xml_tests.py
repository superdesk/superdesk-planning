
import xml.etree.ElementTree as ET
from planning.feed_parsers.ntb_event_xml import NTBEventXMLFeedParser
from planning.tests import TestCase


class NTBEventXMLFeedParserTestCase(TestCase):

    def setUp(self):
        super().setUp()
        self.xml = ET.fromstring("""<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
            <document>
            <time>2016-08-10T15:02:02</time>
            <publiseres>True</publiseres>
            <ntbId>NBRP160810_144545_ja_00</ntbId>
            <service>newscalendar</service>
            <title>MARKS XML TEST</title>
            <location>Fr. Nansens plass 17, Tromsø, Troms</location>
            <timeStart>2016-09-05T09:00:00</timeStart>
            <timeEnd>2016-09-16T16:00:00</timeEnd>
            <alldayevent>False</alldayevent>
            <priority>5</priority>
            <regions>
            <region>Norge</region>
            </regions>
            <districts>
            <district parent="Norge">Troms</district>
            </districts>
            <category>Innenriks</category>
            <subcategory>Redplan element</subcategory>
            <subjects>
            <subject>Kriminalitet og rettsvesen</subject>
            <subject parent="Kriminalitet">Drap;Rettssaker</subject>
            </subjects>
            <emailwriter>jan.morten.bjornbakk@ntb.no</emailwriter>
            <messagetype>Redplan redaksjon</messagetype>
            <geo>
            <latitude>69.65482639999999</latitude>
            <longitude>18.96509590000005</longitude>
            </geo>
            <content>MARKS XML TEST.</content>
            <mediaList>
            <media id="" mediaType="" mimeType="ukjent">
            <caption></caption>
            </media>
            </mediaList>
            </document>""")

    def test_ntb_event_xml_feed_parser_can_parse(self):
        self.assertEqual(True, NTBEventXMLFeedParser().can_parse(self.xml))

    def test_ntb_event_xml_feed_parser_parse(self):
        with self.app.app_context():
            self.event = NTBEventXMLFeedParser().parse(self.xml)
            self.assertEqual('MARKS XML TEST', self.event[0].get('name'))
            self.assertEqual('MARKS XML TEST.', self.event[0].get('definition_long'))
            self.assertEqual(
                {'end': '2016-09-16T16:00:00', 'tz': '', 'start': '2016-09-05T09:00:00'},
                self.event[0].get('dates'))
