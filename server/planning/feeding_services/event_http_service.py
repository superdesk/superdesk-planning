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

from superdesk.errors import IngestApiError
from superdesk.io.feeding_services.http_base_service import HTTPFeedingServiceBase


logger = logging.getLogger(__name__)


class EventHTTPFeedingService(HTTPFeedingServiceBase):
    """
    Feeding Service class which can read events using HTTP
    """

    NAME = 'event_http'
    label = 'Event HTTP feed'
    service = 'events'
    fields = [
        {
            'id': 'url', 'type': 'text', 'label': 'Feed URL',
            'placeholder': 'Feed URL', 'required': True
        }
    ]
    ERRORS = [IngestApiError.apiTimeoutError().get_error_description(),
              IngestApiError.apiRedirectError().get_error_description(),
              IngestApiError.apiRequestError().get_error_description(),
              IngestApiError.apiUnicodeError().get_error_description(),
              IngestApiError.apiParseError().get_error_description(),
              IngestApiError.apiGeneralError().get_error_description()]
    HTTP_AUTH = False

    def _update(self, provider, update):
        """
        Fetch events from external API.

        :param provider: Ingest Provider Details.
        :type provider: dict
        :param update: Any update that is required on provider.
        :type update: dict
        :return: a list of events which can be saved.
        """

        response = self.get_url(self.config['url'])
        parser = self.get_feed_parser(provider)

        logger.info('Ingesting events with {} parser'.format(parser.__class__.__name__))
        logger.info('Ingesting content: {} ...'.format(str(response.content)[:4000]))

        if hasattr(parser, 'parse_http'):
            items = parser.parse_http(response.content, provider)
        else:
            items = parser.parse(response.content)

        if isinstance(items, list):
            yield items
        else:
            yield [items]
