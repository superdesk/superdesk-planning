# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.io import register_feed_parser
from superdesk.io.feed_parsers import XMLFeedParser
from superdesk.utc import utcnow
from pytz import utc


class IcsTwoFeedParser(FileFeedParser):
    """ICS specific parser.

    Feed Parser which can parse the ICS feed and convert to internal event format,
    but the firstcreated and versioncreated times are localised.
    """

    NAME = 'ics20'

    LABEL = 'iCalendar v2.0'

    def can_parse(self, file_path):
        return True

    def parse(self, file_path, provider=None):
        item = {}
        item['firstcreated'] = utc.localize(item['firstcreated']) if item.get('firstcreated') else utcnow()
        item['versioncreated'] = utc.localize(item['versioncreated']) if item.get('versioncreated') else utcnow()
        return item


register_feed_parser(IcsTwoFeedParser.NAME, IcsTwoFeedParser())
