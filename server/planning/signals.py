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
from typing import Any

from superdesk.core import AsyncSignal
from planning.types import EventResourceModel, PlanningResourceModel

__all__ = [
    "planning_created",
    "planning_ingested",
    "events_update",
]

signals = blinker.Namespace()

planning_created = signals.signal("planning:created")
planning_ingested = signals.signal("planning:ingested")
assignment_content_create = signals.signal("planning:assignment_content_create")


#: Signal for when an Event is about to be updated in the DB
#: param updates: Event updates
#: param original_event: `EventResourceModel` instance of the event to be updated
events_update = AsyncSignal[dict[str, Any], EventResourceModel]("events:update")


#: Signal for when a list of Events have been recorded into DB
#: param events: List of events registered in DB
events_created = AsyncSignal[list[EventResourceModel]]("events:created")


#: Signal for when a Planning item has been updated in the DB
#: param updates: Planning item updates
#: param planning_item: `PlanningResourceModel` instance of the event to be updated
planning_updated = AsyncSignal[dict[str, Any], PlanningResourceModel]("planning:update")
