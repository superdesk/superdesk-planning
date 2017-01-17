# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import datetime

from superdesk.io.feeding_services.http_service import HTTPFeedingService
from superdesk.errors import IngestApiError
from superdesk.utc import utcnow
from flask import current_app as app


class EventFileFeedingService(HTTPFeedingService):
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

    label = 'Event HTTP  Feed'

    """
    Defines the collection service to be used with this ingest feeding service.
    """
    service = 'events'

    def _updated(self, provider, update):
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
