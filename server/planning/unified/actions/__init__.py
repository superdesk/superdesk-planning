# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Unified Event & Planning action logic.

Spike, postpone and duplicate used to be implemented as two parallel code paths
(``events/events_*`` and ``planning/planning_*``). Now that both item types live
in the single ``unified_planning`` collection, the logic is merged here and
dispatched on ``item_type``. The ``events/*`` and ``planning/*`` endpoints call
the same entry points below (SDBELGA-1119, SDBELGA-1120).
"""

from .spike import process_spike, process_unspike, process_spike_planning_item
from .postpone import process_postpone, process_postpone_planning_item
from .duplicate import process_duplicate, process_planning_item_duplicate, duplicate_planning_item
from .cancel import (
    process_cancel,
    process_cancel_event,
    process_cancel_planning_item,
    cancel_single_event,
    validate_states,
)
from .reschedule import (
    process_reschedule_event,
    process_reschedule_planning_item,
    event_has_planning_items,
)
from .update_time import process_update_time
from .update_repetitions import process_update_repetitions

__all__ = [
    "process_spike",
    "process_unspike",
    "process_postpone",
    "process_duplicate",
    "process_cancel",
    "process_cancel_event",
    "process_reschedule_event",
    "process_update_time",
    "process_update_repetitions",
    # Re-exported for reuse (events_post cascade, event service cascades, unit tests)
    "process_spike_planning_item",
    "process_postpone_planning_item",
    "process_planning_item_duplicate",
    "duplicate_planning_item",
    "process_cancel_planning_item",
    "process_reschedule_planning_item",
    "cancel_single_event",
    "validate_states",
    "event_has_planning_items",
]
