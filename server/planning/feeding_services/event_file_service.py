# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import io
import logging
import mimetypes
import os
import threading
from datetime import datetime
from typing import BinaryIO, Optional, Tuple

from superdesk.errors import ParserError, ProviderError
from superdesk.io.feeding_services.file_service import FileFeedingService
from superdesk.notification import push_notification
from superdesk.utc import utc
from superdesk.utils import get_sorted_files, FileSortAttributes


logger = logging.getLogger(__name__)


class EventFileFeedingService(FileFeedingService):
    """
    Feeding Service class which can read the configured local file system for article(s).
    """

    NAME = "event_file"

    def __init__(self):
        super().__init__()
        self._fetched_attachments = set()
        self._failed_attachments = set()
        self._lock = threading.Lock()

    ERRORS = [
        ParserError.IPTC7901ParserError().get_error_description(),
        ParserError.nitfParserError().get_error_description(),
        ParserError.newsmlOneParserError().get_error_description(),
        ProviderError.ingestError().get_error_description(),
        ParserError.parseFileError().get_error_description(),
    ]

    label = "Event file feed"

    """
    Defines the collection service to be used with this ingest feeding service.
    """
    service = "events"

    fields = [
        {
            "id": "path",
            "type": "text",
            "label": "Event File Server Folder",
            "placeholder": "path to folder",
            "required": True,
            "errors": {
                3003: "Path not found on server.",
                3004: "Path should be directory.",
            },
        }
    ]

    def _update(self, provider, update):
        self.provider = provider
        self.path = provider.get("config", {}).get("path", None)
        with self._lock:
            self._fetched_attachments = set()
            self._failed_attachments = set()

        if not self.path:
            logger.warn(
                "File Feeding Service {} is configured without path. Please check the configuration".format(
                    provider["name"]
                )
            )
            return []

        for filename in get_sorted_files(self.path, sort_by=FileSortAttributes.created):
            try:
                last_updated = None
                file_path = os.path.join(self.path, filename)
                if os.path.isfile(file_path):
                    stat = os.lstat(file_path)
                    last_updated = datetime.fromtimestamp(stat.st_mtime, tz=utc)

                    if self.is_latest_content(last_updated, provider.get("last_updated")):
                        parser = self.get_feed_parser(provider, file_path)
                        logger.info("Ingesting events with {} parser".format(parser.__class__.__name__))
                        if hasattr(parser, "parse_file"):
                            with open(file_path, "rb") as f:
                                item = parser.parse_file(f, provider, feeding_service=self)
                        else:
                            item = parser.parse(file_path, provider, feeding_service=self)

                        self.after_extracting(item, provider)
                        self.move_file(self.path, filename, provider=provider, success=True)

                        if isinstance(item, list):
                            yield item
                        else:
                            yield [item]
                    else:
                        self.move_file(self.path, filename, provider=provider, success=True)
            except Exception as ex:
                if last_updated and self.is_old_content(last_updated):
                    self.move_file(self.path, filename, provider=provider, success=False)
                raise ParserError.parseFileError("{}-{}".format(provider["name"], self.NAME), filename, ex, provider)

        self._move_attachment_files()
        push_notification("ingest:update")

    def fetch_file(self, filename: str) -> Optional[Tuple[BinaryIO, str]]:
        """Fetch a local file from the configured ingest path.

        :param filename: Filename (relative to self.path)
        :return: Tuple of (stream, content_type) or None on failure
        """
        file_path = os.path.join(self.path, filename)
        try:
            with open(file_path, "rb") as f:
                guessed_type = mimetypes.guess_type(file_path)[0]
                content_type = guessed_type or "application/octet-stream"
                stream = io.BytesIO(f.read())
                with self._lock:
                    self._fetched_attachments.add(filename)
                return stream, content_type
        except FileNotFoundError:
            logger.warning("File %s not found for event ingest", file_path)
            with self._lock:
                self._failed_attachments.add(filename)
        except Exception as ex:
            logger.warning("Failed to fetch file %s: %s", file_path, ex)
            with self._lock:
                self._failed_attachments.add(filename)

        return None

    def _move_attachment_files(self) -> None:
        with self._lock:
            fetched = set(self._fetched_attachments)
            failed = set(self._failed_attachments)

        for filename in fetched:
            try:
                self.move_file(self.path, filename, provider=self.provider, success=True)
            except Exception as ex:
                logger.warning("Failed to move attachment %s to _PROCESSED: %s", filename, ex)

        for filename in failed:
            if filename not in fetched:
                try:
                    self.move_file(self.path, filename, provider=self.provider, success=False)
                except Exception as ex:
                    logger.warning("Failed to move attachment %s to _ERROR: %s", filename, ex)
