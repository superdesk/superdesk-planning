# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import blinker
from bson import ObjectId

from superdesk.core import AsyncSignal
from planning.types import UnifiedPlanningResource, AssignmentEventOrPlanning, LockFields

__all__ = [
    "planning_created",
    "planning_ingested",
    "events_update",
    "on_item_lock",
    "on_item_locked",
    "on_item_unlock",
    "on_item_unlocked",
    "on_unified_planning_duplicated",
    "on_assignment_removed_from_coverage",
]

signals = blinker.Namespace()

planning_created = signals.signal("planning:created")

#: Signal for when a Planning item has been ingested (both created and updated)
#: param updates: Updated Planning item dict
#: param original: Original Planning item dict (if updating), else None
planning_ingested = AsyncSignal[dict, dict | None]("planning:ingested")

#: Signal for them content is created from an Assignment
#: param assignment: The Assignment item dict
#: param planning: The Planning item dict
#: param item: The content item to be created
#: param content_profile: The ContentProfile of the item
assignment_content_create = AsyncSignal[dict, dict, dict, dict]("planning:assignment_content_create")


#: Signal for when an Event is about to be updated in the DB
#: param updates: Event updates
#: param original_event: `EventResourceModel` instance of the event to be updated
events_update = AsyncSignal[dict, dict]("events:update")


#: Signal for when a list of Events have been recorded into DB
#: param events: List of events registered in DB
events_created = AsyncSignal[list[dict]]("events:created")


#: Signal for when a Planning item has been updated in the DB
#: param updates: Planning item updates
#: param planning_item: `PlanningResourceModel` instance of the event to be updated
planning_updated = AsyncSignal[dict, dict]("planning:update")

#: Signal for when an Event time is updated
event_time_updated = AsyncSignal[dict, dict]("events:time_updated")

#: Signal for when an Event is spiked
event_spiked = AsyncSignal[dict, dict]("events:spiked")

#: Signal for when an Event is unspiked
event_unspiked = AsyncSignal[dict, dict]("events:unspiked")

#: Signal for when an Planning Item is spiked
planning_spiked = AsyncSignal[dict, dict]("planning:spiked")

#: Signal for when an Planning Item is unspiked
planning_unspiked = AsyncSignal[dict, dict]("planning:unspiked")

#: Signal for when an Planning Item is postponed
planning_postponed = AsyncSignal[dict, dict]("planning:postponed")

#: Signal for when an Event is postponed
event_postponed = AsyncSignal[dict, dict]("events:postponed")

#: Signal for when an Event is canceled
event_cancel = AsyncSignal[dict, dict]("events:cancel")

#: Signal for when an Event is rescheduled
event_reschedule = AsyncSignal[dict, dict]("events:reschedule")
event_rescheduled = AsyncSignal[dict, dict]("events:rescheduled")

#: Signal for when an Assignment is updated
assignments_updated = AsyncSignal[dict, dict]("assignments:updated")

#: Signal for when an Assignment is deleted
assignments_deleted = AsyncSignal[dict]("assignments:delete")

#: Signal for when an item has been unlocked
on_item_lock = AsyncSignal[UnifiedPlanningResource, LockFields]("item:lock")
on_item_locked = AsyncSignal[UnifiedPlanningResource, UnifiedPlanningResource]("item:locked")
on_item_unlock = AsyncSignal[UnifiedPlanningResource]("item:unlock")
on_item_unlocked = AsyncSignal[AssignmentEventOrPlanning]("item:unlocked")

on_unified_planning_duplicated = AsyncSignal[UnifiedPlanningResource, UnifiedPlanningResource](
    "unified_planning:duplicated"
)

#: Signal for when an Assignment is removed from a Coverage
#: param original: The original UnifiedPlanningResource item
#: param coverage_id: The ID of the Coverage that the Assignment was removed from
on_assignment_removed_from_coverage = AsyncSignal[UnifiedPlanningResource, str]("coverage:assignment_removed")
