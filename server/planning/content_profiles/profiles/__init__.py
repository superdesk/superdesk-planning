# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from planning.types import PlanningProfileResource, PlanningProfileType, DEFAULT_PROFILE_ID

from .advanced_search import DEFAULT_ADVANCED_SEARCH_PROFILE
from .coverage import DEFAULT_COVERAGE_PROFILE
from .event import DEFAULT_EVENT_PROFILE
from .planning import DEFAULT_PLANNING_PROFILE


DEFAULT_PROFILES: dict[PlanningProfileType, PlanningProfileResource] = {
    # Resources
    PlanningProfileType.EVENT: DEFAULT_EVENT_PROFILE,
    PlanningProfileType.PLANNING: DEFAULT_PLANNING_PROFILE,
    PlanningProfileType.COVERAGE: DEFAULT_COVERAGE_PROFILE,
    # Search
    PlanningProfileType.ADVANCED_SEARCH: DEFAULT_ADVANCED_SEARCH_PROFILE,
    # Actions
    PlanningProfileType.EVENT_POSTPONE: PlanningProfileResource(
        id=DEFAULT_PROFILE_ID,
        name=PlanningProfileType.EVENT_POSTPONE.value,
        item_type=PlanningProfileType.EVENT_POSTPONE,
    ),
    PlanningProfileType.EVENT_RESCHEDULE: PlanningProfileResource(
        id=DEFAULT_PROFILE_ID,
        name=PlanningProfileType.EVENT_RESCHEDULE.value,
        item_type=PlanningProfileType.EVENT_RESCHEDULE,
    ),
    PlanningProfileType.EVENT_CANCEL: PlanningProfileResource(
        id=DEFAULT_PROFILE_ID,
        name=PlanningProfileType.EVENT_CANCEL.value,
        item_type=PlanningProfileType.EVENT_CANCEL,
    ),
    PlanningProfileType.PLANNING_CANCEL: PlanningProfileResource(
        id=DEFAULT_PROFILE_ID,
        name=PlanningProfileType.PLANNING_CANCEL.value,
        item_type=PlanningProfileType.PLANNING_CANCEL,
    ),
    PlanningProfileType.CANCEL_ALL_COVERAGES: PlanningProfileResource(
        id=DEFAULT_PROFILE_ID,
        name=PlanningProfileType.CANCEL_ALL_COVERAGES.value,
        item_type=PlanningProfileType.CANCEL_ALL_COVERAGES,
    ),
    PlanningProfileType.CANCEL_COVERAGE: PlanningProfileResource(
        id=DEFAULT_PROFILE_ID,
        name=PlanningProfileType.CANCEL_COVERAGE.value,
        item_type=PlanningProfileType.CANCEL_COVERAGE,
    ),
}
