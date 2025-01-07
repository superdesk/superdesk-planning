# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import mock
from datetime import timedelta

from superdesk.utc import utcnow

from planning.tests import TestCase
from planning.events.events_service import EventsAsyncService

from .export_to_newsroom import ExportToNewsroom
from ..planning import PlanningAsyncService


class MockTransmitter:
    events = []
    planning = []

    def transmit(self, queue_item):
        if queue_item.get("content_type") == "event":
            self.events.append(queue_item.get("item_id"))
        else:
            self.planning.append(queue_item.get("item_id"))


class ExportToNewsroomTest(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()

        self.event_service = EventsAsyncService()
        self.planning_service = PlanningAsyncService()

    async def setup_data(self):
        utc_now = utcnow()
        self.setup_test_user()

        events = [
            {
                "guid": "draft",
                "dates": {
                    "start": utc_now,
                    "end": utc_now + timedelta(days=1),
                    "tx": "UTC",
                },
                "name": "event_name",
                "state": "draft",
                "type": "event",
            },
            {
                "guid": "scheduled",
                "dates": {
                    "start": utc_now,
                    "end": utc_now + timedelta(days=1),
                    "tx": "UTC",
                },
                "name": "event_name",
                "state": "scheduled",
                "pubstatus": "usable",
                "type": "event",
            },
            {
                "guid": "postponed",
                "dates": {
                    "start": utc_now,
                    "end": utc_now + timedelta(days=1),
                    "tx": "UTC",
                },
                "name": "event_name",
                "state": "postponed",
                "pubstatus": "usable",
                "type": "event",
            },
            {
                "guid": "rescheduled",
                "dates": {
                    "start": utc_now,
                    "end": utc_now + timedelta(days=1),
                    "tx": "UTC",
                },
                "name": "event_name",
                "state": "rescheduled",
                "pubstatus": "usable",
                "type": "event",
            },
            {
                "guid": "cancelled",
                "dates": {
                    "start": utc_now,
                    "end": utc_now + timedelta(days=1),
                    "tx": "UTC",
                },
                "name": "event_name",
                "state": "cancelled",
                "pubstatus": "usable",
                "type": "event",
            },
            {
                "guid": "killed",
                "dates": {
                    "start": utc_now,
                    "end": utc_now + timedelta(days=1),
                    "tx": "UTC",
                },
                "name": "event_name",
                "state": "killed",
                "pubstatus": "cancelled",
                "type": "event",
            },
            {
                "guid": "postponed-not-published",
                "dates": {
                    "start": utc_now,
                    "end": utc_now + timedelta(days=1),
                    "tx": "UTC",
                },
                "name": "event_name",
                "state": "postponed",
                "type": "event",
            },
            {
                "guid": "rescheduled-not-published",
                "dates": {
                    "start": utc_now,
                    "end": utc_now + timedelta(days=1),
                    "tx": "UTC",
                },
                "name": "event_name",
                "state": "rescheduled",
                "type": "event",
            },
            {
                "guid": "cancelled-not-published",
                "dates": {
                    "start": utc_now,
                    "end": utc_now + timedelta(days=1),
                    "tx": "UTC",
                },
                "name": "event_name",
                "state": "cancelled",
                "type": "event",
            },
        ]

        planning = [
            {
                "guid": "draft",
                "planning_date": utc_now,
                "slugline": "planning slugline",
                "state": "draft",
                "type": "planning",
            },
            {
                "guid": "scheduled",
                "planning_date": utc_now,
                "slugline": "planning slugline",
                "state": "scheduled",
                "pubstatus": "usable",
                "type": "planning",
            },
            {
                "guid": "postponed",
                "planning_date": utc_now,
                "slugline": "planning slugline",
                "state": "postponed",
                "pubstatus": "usable",
                "type": "planning",
            },
            {
                "guid": "rescheduled",
                "planning_date": utc_now,
                "slugline": "planning slugline",
                "state": "rescheduled",
                "pubstatus": "usable",
                "type": "planning",
            },
            {
                "guid": "cancelled",
                "planning_date": utc_now,
                "slugline": "planning slugline",
                "state": "cancelled",
                "pubstatus": "usable",
                "type": "planning",
            },
            {
                "guid": "killed",
                "planning_date": utc_now,
                "slugline": "planning slugline",
                "state": "killed",
                "pubstatus": "cancelled",
                "type": "planning",
            },
            {
                "guid": "postponed-not-published",
                "planning_date": utc_now,
                "slugline": "planning slugline",
                "state": "postponed",
                "type": "planning",
            },
            {
                "guid": "rescheduled-not-published",
                "planning_date": utc_now,
                "slugline": "planning slugline",
                "state": "rescheduled",
                "type": "planning",
            },
            {
                "guid": "cancelled-not-published",
                "planning_date": utc_now,
                "slugline": "planning slugline",
                "state": "cancelled",
                "type": "planning",
            },
        ]

        await self.event_service.create(events)
        await self.planning_service.create(planning)

    @mock.patch("planning.commands.export_to_newsroom.NewsroomHTTPTransmitter")
    async def test_events_events_planning(self, mock_transmitter):
        async with self.app.app_context():
            await self.setup_data()

            mock_transmitter.return_value = MockTransmitter()
            ExportToNewsroom().run(assets_url="foo", resource_url="bar")
            valid_ids = ["scheduled", "postponed", "rescheduled"]

            for item_id in mock_transmitter.return_value.events:
                self.assertIn(item_id, valid_ids)

            for item_id in mock_transmitter.return_value.planning:
                self.assertIn(item_id, valid_ids)
