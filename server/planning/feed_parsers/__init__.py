# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.io.registry import register_feed_parser
from .ics_2_0 import IcsTwoFeedParser
from .superdesk_event_json import EventJsonFeedParser
from .events_ml import EventsMLParser
from .superdesk_planning_xml import PlanningXmlFeedParser

register_feed_parser(IcsTwoFeedParser.NAME, IcsTwoFeedParser())
register_feed_parser(EventJsonFeedParser.NAME, EventJsonFeedParser())
register_feed_parser(EventsMLParser.NAME, EventsMLParser())
register_feed_parser(PlanningXmlFeedParser.NAME, PlanningXmlFeedParser())
