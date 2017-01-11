# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from superdesk.errors import ParserError, ProviderError
from superdesk.io.registry import register_feeding_service
from superdesk.io.feeding_services.file_service import FileFeedingService


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


register_feeding_service(
    EventFileFeedingService.NAME,
    EventFileFeedingService(),
    EventFileFeedingService.ERRORS
)
