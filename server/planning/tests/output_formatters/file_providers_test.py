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

from planning.tests import TestCase
from superdesk.publish import TransmitterFileEntry
from superdesk.publish.transmitters.ftp import FTPPublishService
from superdesk.publish.transmitters.http_push import HTTPPushService
from planning.output_formatters.file_providers import get_event_planning_files_for_transmission


class NotFoundResponse:
    status_code = 404


class CreatedResponse:
    status_code = 201


class TestEventMedia(BytesIO):
    _id = "event_file"
    filename = "event_file.csv"
    mimetype = "text/csv"


class TestPlanningMedia(BytesIO):
    _id = "plan_file"
    filename = "plan_file.csv"
    mimetype = "text/csv"


class FileProvidersTestCase(TestCase):
    event_item = {
        "_id": "urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7946",
        "guid": "urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7946",
        "files": [
            TransmitterFileEntry(
                media="event_file",
                mimetype="text/csv",
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

    @mock.patch("superdesk.publish.transmitters.http_push.app")
    @mock.patch("superdesk.publish.transmitters.http_push.requests.Session.send", return_value=CreatedResponse)
    @mock.patch("requests.get", return_value=NotFoundResponse)
    def test_push_event_files(self, get_mock, send_mock, app_mock):
        app_mock.config = {}
        app_mock.media.get.return_value = TestEventMedia(b"bin")
        dest = {"config": {"assets_url": "http://example.com", "secret_token": "foo"}}
        service = HTTPPushService()
        service._copy_published_media_files(self.event_item, dest)
        app_mock.media.get.assert_called_with("event_file", resource="events_files")
        get_mock.assert_called_with("http://example.com/event_file", timeout=(5, 30))
        send_mock.assert_called_once_with(mock.ANY, timeout=(5, 30))
        request = send_mock.call_args[0][0]
        self.assertEqual("http://example.com/", request.url)
        self.assertEqual("POST", request.method)
        self.assertIn(b"bin", request.body)
        self.assertIn(b"event_file", request.body)
        self.assertIn("x-superdesk-signature", request.headers)
        self.assertEqual(
            request.headers["x-superdesk-signature"], "sha1=%s" % hmac.new(b"foo", request.body, "sha1").hexdigest()
        )

    @mock.patch("superdesk.publish.transmitters.http_push.app")
    @mock.patch("superdesk.publish.transmitters.http_push.requests.Session.send", return_value=CreatedResponse)
    @mock.patch("requests.get", return_value=NotFoundResponse)
    def test_push_planning_files(self, get_mock, send_mock, app_mock):
        app_mock.config = {}
        app_mock.media.get.return_value = TestPlanningMedia(b"bin")
        dest = {"config": {"assets_url": "http://example.com", "secret_token": "foo"}}
        service = HTTPPushService()
        service._copy_published_media_files(self.plan_item, dest)
        app_mock.media.get.assert_called_with("plan_file", resource="planning_files")
        get_mock.assert_called_with("http://example.com/plan_file", timeout=(5, 30))
        send_mock.assert_called_once_with(mock.ANY, timeout=(5, 30))
        request = send_mock.call_args[0][0]
        self.assertEqual("http://example.com/", request.url)
        self.assertEqual("POST", request.method)
        self.assertIn(b"bin", request.body)
        self.assertIn(b"plan_file", request.body)
        self.assertIn("x-superdesk-signature", request.headers)
        self.assertEqual(
            request.headers["x-superdesk-signature"], "sha1=%s" % hmac.new(b"foo", request.body, "sha1").hexdigest()
        )
