# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import os
import xml.etree.ElementTree as ET
from planning.tests import TestCase
from superdesk.io import get_feeding_service
from superdesk.io.commands.update_ingest import ingest_items
from superdesk.io.registry import registered_feed_parsers
from superdesk import get_resource_service


def setup_providers(context):
    app = context.app
    context.providers = {}
    context.ingest_items = ingest_items
    with app.test_request_context(app.config['URL_PREFIX']):
        path_to_fixtures = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), 'fixtures')
        providers = [
            {'name': 'ntbevent', 'source': 'Event Ingest', 'feeding_service': 'event_file',
             'feed_parser': 'ntb_event_xml', 'is_closed': False,
             'critical_errors': {'2005': True}, 'config': {'path': path_to_fixtures},
             "content_types": ["event"],
             },
        ]

        result = get_resource_service('ingest_providers').post(providers)

        context.providers['ntbevent'] = result[0]


class IngestTest(TestCase):
    def setUp(self):
        setup_providers(self)

    def get_parsed_documents(self, parser, document):
        return parser.parse(document)

    def test_ingest_update_same_event(self):
        xml = ET.fromstring("""<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
            <document>
            <guid>NTB-123456</guid>
            <time>2016-08-10T15:02:02</time>
            <publiseres>True</publiseres>
            <ntbId>NBRP160810_144545_ja_00</ntbId>
            <service>newscalendar</service>
            <title>Original Content</title>
            <location>Fr. Nansens plass 17, Tromsø, Troms</location>
            <timeStart>2016-09-05T09:00:00</timeStart>
            <timeEnd>2016-09-05T16:00:00</timeEnd>
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
            <content>Original Content</content>
            <mediaList>
            <media id="" mediaType="" mimeType="ukjent">
            <caption></caption>
            </media>
            </mediaList>
            </document>""")

        with self.app.test_request_context(self.app.config['URL_PREFIX']):
            # ingest event
            events = self.get_parsed_documents(registered_feed_parsers.get('ntb_event_xml'), xml)
            provider = get_resource_service('ingest_providers').find_one(req=None, _id=self.providers.get('ntbevent'))
            self.ingest_items(events, provider, get_feeding_service('event_file'))
            ingested_event = get_resource_service('events').find_one(req=None, _id='NTB-123456')
            self.assertTrue(ingested_event['_id'], 'NTB-123456')
            self.assertTrue(ingested_event['name'], 'Original Content')
            self.assertTrue(ingested_event['dates']['start'], '2016-09-05T09:00:00')
            self.assertTrue(ingested_event['dates']['end'], '2016-09-05T16:00:00')
            self.assertTrue(ingested_event['_planning_schedule'][0]['scheduled'], '2016-09-05T09:00:00')

            # ingest updated event
            events = self.get_parsed_documents(registered_feed_parsers.get('ntb_event_xml'), xml)
            events[0]['dates']['start'] = '2016-09-06T10:00:00'
            events[0]['dates']['end'] = '2016-09-06T14:00:00'
            events[0]['name'] = 'Updated Content'
            self.ingest_items(events, provider, get_feeding_service('event_file'))
            ingested_event = get_resource_service('events').find_one(req=None, _id='NTB-123456')
            self.assertTrue(ingested_event['_id'], 'NTB-123456')
            self.assertTrue(ingested_event['name'], 'Updated Content')
            self.assertTrue(ingested_event['dates']['start'], '2016-09-05T09:00:00')
            self.assertTrue(ingested_event['dates']['end'], '2016-09-05T16:00:00')
            self.assertTrue(ingested_event['_planning_schedule'][0]['scheduled'], '2016-09-16T16:00:00')
