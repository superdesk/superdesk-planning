# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.io.registry import register_feeding_service
from .event_file_service import EventFileFeedingService
from .event_http_service import EventHTTPFeedingService
from .event_email_service import EventEmailFeedingService


register_feeding_service(
    EventFileFeedingService
)
register_feeding_service(
    EventHTTPFeedingService
)
register_feeding_service(
    EventEmailFeedingService
)
