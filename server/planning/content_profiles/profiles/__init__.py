# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .actions import DEFAULT_ACTION_PROFILES
from .advanced_search import DEFAULT_ADVANCED_SEARCH_PROFILE
from .coverage import DEFAULT_COVERAGE_PROFILE
from .event import DEFAULT_EVENT_PROFILE
from .planning import DEFAULT_PLANNING_PROFILE

DEFAULT_PROFILES = [
    DEFAULT_EVENT_PROFILE,
    DEFAULT_PLANNING_PROFILE,
    DEFAULT_COVERAGE_PROFILE,
    DEFAULT_ADVANCED_SEARCH_PROFILE,
] + DEFAULT_ACTION_PROFILES
