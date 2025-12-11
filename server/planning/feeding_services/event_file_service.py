# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
import os
import mimetypes
from datetime import datetime

from flask import current_app as app

from superdesk import get_resource_service
from superdesk.errors import ParserError, ProviderError
from superdesk.io.feeding_services.file_service import FileFeedingService
from superdesk.media.media_operations import process_file_from_stream
from superdesk.notification import push_notification
from superdesk.utc import utc
from superdesk.utils import get_sorted_files, FileSortAttributes


logger = logging.getLogger(__name__)


class EventFileFeedingService(FileFeedingService):
    """
    Feeding Service class which can read the configured local file system for article(s).
    """

    NAME = "event_file"
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
                                item = parser.parse_file(f, provider)
                        else:
                            item = parser.parse(file_path, provider)

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

        push_notification("ingest:update")

    def fetch_file(self, base_dir, filename):
        """
        Fetch a local file, upload to media storage, and create an events_files record.

        :param base_dir: Directory to resolve relative paths against
        :param filename: Filename or absolute path to the file
        :return: The created events_files document ID, or None on failure
        """
        file_path_to_use = filename
        if not os.path.isabs(file_path_to_use):
            file_path_to_use = os.path.join(base_dir, filename)

        events_files_service = get_resource_service("events_files")
        media_id = None

        try:
            with open(file_path_to_use, "rb") as content:
                guessed_type = mimetypes.guess_type(file_path_to_use)[0]
                content_type = guessed_type or "application/octet-stream"
                file_name, content_type, metadata = process_file_from_stream(content, content_type)
                content.seek(0)
                media_id = app.media.put(
                    content,
                    filename=file_name or os.path.basename(file_path_to_use),
                    content_type=content_type,
                    metadata=metadata,
                    resource="events_files",
                )

                payload = {"media": media_id, "mimetype": content_type}
                if metadata:
                    payload["filemeta"] = metadata

                ids = events_files_service.post([payload])
                saved_id = next(iter(ids or []), None)
                if saved_id:
                    logger.info("Attached event file %s as %s", file_path_to_use, saved_id)
                    return saved_id
        except FileNotFoundError:
            logger.warning("File %s not found for event ingest", file_path_to_use)
        except Exception as ex:
            logger.warning("Failed to ingest file %s: %s", file_path_to_use, ex)
            if media_id:
                try:
                    app.media.delete(media_id)
                except Exception:
                    logger.warning("Failed to cleanup media for %s", file_path_to_use)

        return None
