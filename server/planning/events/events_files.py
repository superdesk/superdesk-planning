# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

import io
import logging
import mimetypes
import os

from flask import current_app as app

import superdesk
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.media.media_operations import process_file_from_stream

logger = logging.getLogger(__name__)


class EventsFilesResource(superdesk.Resource):
    schema = {
        "media": {"type": "media"},
        "mimetype": {"type": "string"},
        "filemeta": {"type": "dict"},
    }
    datasource = {
        "source": "events_files",
        "projection": {
            "mimetype": 1,
            "filemeta": 1,
            "_created": 1,
            "_updated": 1,
            "_etag": 1,
            "media": 1,
        },
    }
    url = "events_files"
    item_methods = ["GET", "DELETE"]
    resource_methods = ["GET", "POST"]
    privileges = {
        "POST": "planning_event_management",
        "DELETE": "planning_event_management",
    }


class EventsFilesService(superdesk.Service):
    def on_create(self, docs):
        for doc in docs:
            # save the media id to retrieve the file later
            if "media" in doc:
                _file = app.media.get(doc["media"])
                if _file:
                    doc["filemeta"] = {
                        "media_id": doc["media"],
                        "content_type": _file.content_type,
                        "filename": _file.filename,
                        "length": _file.length,
                    }

    def on_created(self, docs):
        for doc in docs:
            # check if the filename contains a folder, if so just return the file name component
            if isinstance(doc.get("media"), dict) and "/" in doc.get("media", {}).get("name", ""):
                doc["media"]["name"] = doc["media"]["name"].split("/")[1]

    def on_delete(self, doc):
        events_using_file = get_resource_service("events").find(where={"files": doc.get("_id")})
        if events_using_file.count() > 0:
            raise SuperdeskApiError.forbiddenError("Delete failed. File still used by other events.")

    def ingest_file(self, content, filename, content_type=None):
        """Upload binary content to media storage and create an events_files record."""

        media_id = None
        stream = None

        try:
            if hasattr(content, "read"):
                stream = content
            else:
                stream = io.BytesIO(content)

            if not content_type:
                guessed_type = mimetypes.guess_type(filename)[0]
                content_type = guessed_type or "application/octet-stream"

            file_name, content_type, metadata = process_file_from_stream(stream, content_type)
            stream.seek(0)

            media_id = app.media.put(
                stream,
                filename=file_name or os.path.basename(filename),
                content_type=content_type,
                metadata=metadata,
                resource="events_files",
            )

            payload = {"media": media_id, "mimetype": content_type}
            if metadata:
                payload["filemeta"] = metadata

            ids = self.post([payload])
            saved_id = next(iter(ids or []), None)
            if saved_id:
                logger.info("Ingested event file %s as %s", filename, saved_id)
                return saved_id
        except Exception as ex:
            logger.warning("Failed to ingest file %s: %s", filename, ex)
            if media_id:
                try:
                    app.media.delete(media_id)
                except Exception:
                    logger.warning("Failed to cleanup media for %s", filename)
        finally:
            if stream and hasattr(stream, "close"):
                try:
                    stream.close()
                except Exception:
                    logger.warning("Failed to close stream for %s", filename)

        return None
