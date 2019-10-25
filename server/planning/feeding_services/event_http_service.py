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
import datetime
import requests
import traceback

from superdesk.io.feeding_services.http_service import HTTPFeedingService
from superdesk.errors import IngestApiError
from superdesk.utc import utcnow
from flask import current_app as app


logger = logging.getLogger(__name__)


class EventHTTPFeedingService(HTTPFeedingService):
    """
    Feeding Service class which can read events using HTTP
    """

    NAME = 'event_http'
    ERRORS = [IngestApiError.apiTimeoutError().get_error_description(),
              IngestApiError.apiRedirectError().get_error_description(),
              IngestApiError.apiRequestError().get_error_description(),
              IngestApiError.apiUnicodeError().get_error_description(),
              IngestApiError.apiParseError().get_error_description(),
              IngestApiError.apiGeneralError().get_error_description()]

    label = 'Event HTTP feed'

    """
    Defines the collection service to be used with this ingest feeding service.
    """
    service = 'events'

    fields = [
        {
            'id': 'url', 'type': 'text', 'label': 'Feed URL',
            'placeholder': 'Feed URL', 'required': True
        }
    ]

    def _update(self, provider, update):
        updated = utcnow()

        last_updated = provider.get('last_updated')
        ttl_minutes = app.config['INGEST_EXPIRY_MINUTES']
        if not last_updated or last_updated < updated - datetime.timedelta(minutes=ttl_minutes):
            last_updated = updated - datetime.timedelta(minutes=ttl_minutes)

        self.provider = provider
        provider_config = provider.get('config')
        if not provider_config:
            provider_config = {}
            provider['config'] = provider_config

        self.URL = provider_config.get('url')
        payload = {}

        try:
            response = requests.get(self.URL, params=payload, timeout=15)
            # TODO: check if file has been updated since provider last_updated
            # although some ptovider do not include 'Last-Modified' in headers
            # so unsure how to do this
            logger.info('Http Headers: %s', response.headers)
        except requests.exceptions.Timeout as ex:
            # Maybe set up for a retry, or continue in a retry loop
            raise IngestApiError.apiTimeoutError(ex, self.provider)
        except requests.exceptions.TooManyRedirects as ex:
            # Tell the user their URL was bad and try a different one
            raise IngestApiError.apiRedirectError(ex, self.provider)
        except requests.exceptions.RequestException as ex:
            # catastrophic error. bail.
            raise IngestApiError.apiRequestError(ex, self.provider)
        except Exception as error:
            traceback.print_exc()
            raise IngestApiError.apiGeneralError(error, self.provider)

        if response.status_code == 404:
            raise LookupError('Not found %s' % payload)

        parser = self.get_feed_parser(provider)
        logger.info('Ingesting events with {} parser'.format(parser.__class__.__name__))
        logger.info('Ingesting: %s', str(response.content))

        if getattr(parser, 'parse_http'):
            items = parser.parse_http(response.content, provider)
        else:
            items = parser.parse(response.content)

        if isinstance(items, list):
            yield items
        else:
            yield [items]
