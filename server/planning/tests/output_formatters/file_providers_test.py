# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from io import BytesIO
from unittest import mock
import hmac

import aiohttp
from aioresponses import aioresponses
from yarl import URL

from planning.tests import TestCase
from superdesk.publish import TransmitterFileEntry
from superdesk.publish.transmitters.ftp import FTPPublishService
from superdesk.publish.transmitters.http_push import HTTPPushService
from planning.output_formatters.file_providers import get_event_planning_files_for_transmission


class TestEventMedia(BytesIO):
    _id = "event_file"
    filename = "event_file.csv"
    mimetype = "text/csv"
    content_type = "text/csv"


class TestPlanningMedia(BytesIO):
    _id = "plan_file"
    filename = "plan_file.csv"
    mimetype = "text/csv"
    content_type = "text/csv"


class MockMedia:
    def __init__(self, test_file):
        self.get = mock.Mock(return_value=test_file)


class MockApp:
    def __init__(self, test_file):
        self.media = MockMedia(test_file)


class FileProvidersTestCase(TestCase):
    event_item = {
        "_id": "urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7946",
        "guid": "urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7946",
        "files": [
            TransmitterFileEntry(
                media="event_file",
                mimetype="text/csv",
                resource="events_files",
            )
        ],
        "type": "event",
    }
    plan_item = {
        "_id": "urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7947",
        "guid": "urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7947",
        "files": [
            TransmitterFileEntry(
                media="plan_file",
                mimetype="text/csv",
                resource="planning_files",
            )
        ],
        "type": "planning",
    }
    text_item = {
        "_id": "urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7948",
        "guid": "urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7948",
        "files": [
            TransmitterFileEntry(
                media="text_file",
                mimetype="text/csv",
            )
        ],
        "type": "text",
    }

    def test_processes_planning_items_only(self):
        self.assertDictEqual(
            get_event_planning_files_for_transmission(HTTPPushService.NAME, self.event_item),
            {
                "event_file": TransmitterFileEntry(
                    media="event_file",
                    mimetype="text/csv",
                    resource="events_files",
                )
            },
        )
        self.assertDictEqual(
            get_event_planning_files_for_transmission(HTTPPushService.NAME, self.plan_item),
            {
                "plan_file": TransmitterFileEntry(
                    media="plan_file",
                    mimetype="text/csv",
                    resource="planning_files",
                )
            },
        )
        self.assertDictEqual(get_event_planning_files_for_transmission(HTTPPushService.NAME, self.text_item), {})

    def test_ignores_ftp_transmitter(self):
        self.assertDictEqual(get_event_planning_files_for_transmission(FTPPublishService.NAME, self.event_item), {})

    def test_handle_unprocessed_files(self):
        planning_item = {"type": "planning", "files": ["fileid"]}
        self.assertEqual({}, get_event_planning_files_for_transmission(HTTPPushService.NAME, planning_item))

    async def test_push_event_files(self):
        test_file = TestEventMedia(b"bin")
        mock_app = MockApp(test_file)
        dest = {"config": {"assets_url": "http://example.com", "secret_token": "foo"}}

        with aioresponses() as http_mock, mock.patch(
            "superdesk.publish.transmitters.http_push.get_current_app", return_value=mock_app
        ):
            http_mock.get("http://example.com/event_file", repeat=True, status=404, payload={})
            http_mock.post("http://example.com", repeat=True, status=201, payload={})

            service = HTTPPushService()
            await service._copy_published_media_files(self.event_item, dest)

            mock_app.media.get.assert_called_with("event_file", resource="events_files")
            http_mock.assert_called_with("http://example.com/event_file", method="GET")

            post_requests = http_mock.requests[("POST", URL("http://example.com"))]
            self.assertEqual(len(post_requests), 1)

            request_body = post_requests[0].kwargs["data"]
            self.assertIsInstance(request_body, aiohttp.FormData)

            request_body_bytes = await request_body().as_bytes()
            self.assertIn(b"bin", request_body_bytes)
            self.assertIn(b"event_file", request_body_bytes)

            headers = post_requests[0].kwargs["headers"]
            self.assertEqual(
                headers["x-superdesk-signature"],
                "sha1=%s" % hmac.new(b"foo", request_body_bytes, "sha1").hexdigest(),
            )

    async def test_push_planning_files(self):
        test_file = TestPlanningMedia(b"bin")
        mock_app = MockApp(test_file)
        dest = {"config": {"assets_url": "http://example.com", "secret_token": "foo"}}

        with aioresponses() as http_mock, mock.patch(
            "superdesk.publish.transmitters.http_push.get_current_app", return_value=mock_app
        ):
            http_mock.get("http://example.com/plan_file", repeat=True, status=404, payload={})
            http_mock.post("http://example.com", repeat=True, status=201, payload={})

            service = HTTPPushService()
            await service._copy_published_media_files(self.plan_item, dest)

            mock_app.media.get.assert_called_with("plan_file", resource="planning_files")
            http_mock.assert_called_with("http://example.com/plan_file", method="GET")

            post_requests = http_mock.requests[("POST", URL("http://example.com"))]
            self.assertEqual(len(post_requests), 1)

            request_body = post_requests[0].kwargs["data"]
            self.assertIsInstance(request_body, aiohttp.FormData)

            request_body_bytes = await request_body().as_bytes()
            self.assertIn(b"bin", request_body_bytes)
            self.assertIn(b"plan_file", request_body_bytes)

            headers = post_requests[0].kwargs["headers"]
            self.assertEqual(
                headers["x-superdesk-signature"],
                "sha1=%s" % hmac.new(b"foo", request_body_bytes, "sha1").hexdigest(),
            )
