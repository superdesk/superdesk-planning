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
import os
from datetime import datetime

from xml.etree import ElementTree
from superdesk.errors import ParserError, ProviderError
from superdesk.io.feeding_services.file_service import FileFeedingService
from planning.feed_parsers.ntb_event_xml import NTBEventXMLFeedParser
from planning.feed_parsers.ics_2_0 import IcsTwoFeedParser
from superdesk.notification import push_notification
from superdesk.utc import utc
from superdesk.utils import get_sorted_files, FileSortAttributes
from icalendar import Calendar

logger = logging.getLogger(__name__)


class EventFileFeedingService(FileFeedingService):
    """
    Feeding Service class which can read the configured local file system for article(s).
    """

    NAME = 'event_file'
    ERRORS = [
        ParserError.IPTC7901ParserError().get_error_description(),
        ParserError.nitfParserError().get_error_description(),
        ParserError.newsmlOneParserError().get_error_description(),
        ProviderError.ingestError().get_error_description(),
        ParserError.parseFileError().get_error_description()
    ]

    label = 'Event File Feed'

    """
    Defines the collection service to be used with this ingest feeding service.
    """
    service = 'events'

    def _update(self, provider, update):
        self.provider = provider
        self.path = provider.get('config', {}).get('path', None)

        if not self.path:
            logger.warn('File Feeding Service {} is configured without path. Please check the configuration'
                        .format(provider['name']))
            return []

        registered_parser = self.get_feed_parser(provider)
        for filename in get_sorted_files(self.path, sort_by=FileSortAttributes.created):
            try:
                last_updated = None
                file_path = os.path.join(self.path, filename)
                if os.path.isfile(file_path):
                    stat = os.lstat(file_path)
                    last_updated = datetime.fromtimestamp(stat.st_mtime, tz=utc)

                    if self.is_latest_content(last_updated, provider.get('last_updated')):
                        if isinstance(registered_parser, NTBEventXMLFeedParser):
                            logger.info('Ingesting xml events')
                            with open(file_path, 'rb') as f:
                                xml = ElementTree.parse(f)
                                parser = self.get_feed_parser(provider, xml.getroot())
                                item = parser.parse(xml.getroot(), provider)
                        elif isinstance(registered_parser, IcsTwoFeedParser):
                            logger.info('Ingesting ics events')
                            with open(file_path, 'rb') as f:
                                cal = Calendar.from_ical(f.read())
                                parser = self.get_feed_parser(provider, cal)
                                item = parser.parse(cal, provider)
                        else:
                            logger.info('Ingesting events with unknown parser')
                            parser = self.get_feed_parser(provider, file_path)
                            item = parser.parse(file_path, provider)

                        self.after_extracting(item, provider)
                        self.move_file(self.path, filename, provider=provider, success=True)

                        if isinstance(item, list):
                            yield item
                        else:
                            yield [item]
                    else:
                        self.move_file(self.path, filename, provider=provider, success=True)
            except Exception as ex:
                if last_updated and self.is_old_content(last_updated):
                    self.move_file(self.path, filename, provider=provider, success=False)
                raise ParserError.parseFileError('{}-{}'.format(provider['name'], self.NAME), filename, ex, provider)

        push_notification('ingest:update')
