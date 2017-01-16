# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging

from superdesk.errors import ParserError
from superdesk.io.feed_parsers import XMLFeedParser

logger = logging.getLogger(__name__)


class OutlookXMLFeedParser(XMLFeedParser):
    """Outlook XML parser.

    Feed Parser which can parse an XML file exported from Outlook and convert to internal event format,
    but the firstcreated and versioncreated times are localised.
    """

    NAME = 'outlook'

    label = 'Outlook XML'

    def can_parse(self, xml):
        return True

    def parse(self, xml, provider=None):
        try:
            items = []
            for entry in xml.findall(self.qname('document')):
                title = self.get_elem_content(entry.find(self.qname('title')))
                logger.warn('\n\n\n PARSING EVENT TITLE: %s \n\n\n', title)

            # parse xml file

            return items
        except Exception as ex:
            raise ParserError.parseMessageError(ex, provider)

    def get_elem_content(self, elem):
        return elem.text if elem is not None else ''
