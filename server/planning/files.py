# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning Files.

Event & Planning file attachments are stored in a single ``events_files`` mongo
collection and served by one shared service. The two endpoints (``events_files``
and ``planning_files``) are kept for backwards compatibility with the client and
to preserve their distinct privileges.
"""

import io
import logging
import mimetypes
import os

from quart_babel import gettext as _

from superdesk import Resource
from superdesk.core import get_current_app
from superdesk.errors import SuperdeskApiError
from superdesk.eve_async.service import AsyncBaseService
from superdesk.media.media_operations import process_file_from_stream

from planning.types.unified import UnifiedPlanningResource


logger = logging.getLogger(__name__)


FILES_SOURCE = "events_files"
FILES_PROJECTION = {
    "mimetype": 1,
    "filemeta": 1,
    "_created": 1,
    "_updated": 1,
    "_etag": 1,
    "media": 1,
}


class FilesAsyncService(AsyncBaseService):
    """Shared service backing both the events_files and planning_files endpoints."""

    async def on_create_async(self, docs):
        app = get_current_app()
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

    async def on_created_async(self, docs):
        for doc in docs:
            # check if the filename contains a folder, if so just return the file name component
            if isinstance(doc.get("media"), dict) and "/" in doc.get("media", {}).get("name", ""):
                doc["media"]["name"] = doc["media"]["name"].split("/")[1]

    async def on_delete_async(self, doc):
        # A file may be referenced by an Event/Planning item directly (``files``) or
        # by a Coverage on a Planning item (``coverages.planning.files`` / ``xmp_file``).
        # Both Events & Planning now live in the single unified resource.
        file_id = doc.get("_id")
        find_clause = {
            "$or": [
                {"files": file_id},
                {"coverages.planning.files": file_id},
                {"coverages.planning.xmp_file": file_id},
            ],
        }
        items_using_file = await UnifiedPlanningResource.get_service().count(find_clause, use_mongo=True)
        if items_using_file > 0:
            raise SuperdeskApiError.forbiddenError(_("Delete failed. File still used by other items."))

    async def ingest_file(self, content, filename, content_type=None):
        """Upload binary content to media storage and create a files record."""

        media_id = None
        stream = None
        app = get_current_app()

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

            media_id = await app.media.put_async(
                stream,
                filename=file_name or os.path.basename(filename),
                content_type=content_type,
                metadata=metadata,
                resource=FILES_SOURCE,
            )

            payload = {"media": media_id, "mimetype": content_type}
            if metadata:
                payload["filemeta"] = metadata

            ids = await self.post_async([payload])
            saved_id = next(iter(ids or []), None)
            if saved_id:
                logger.info("Ingested file %s as %s", filename, saved_id)
                return saved_id
        except Exception as ex:
            logger.warning("Failed to ingest file %s: %s", filename, ex)
            if media_id:
                try:
                    await app.media.delete_async(media_id)
                except Exception:
                    logger.warning("Failed to cleanup media for %s", filename)
        finally:
            if stream is not None:
                close_fn = getattr(stream, "close", None)
                if callable(close_fn):
                    try:
                        close_fn()
                    except Exception:
                        logger.warning("Failed to close stream for %s", filename)

        return None


class EventsFilesResource(Resource):
    schema = {
        "media": {"type": "media"},
        "mimetype": {"type": "string"},
        "filemeta": {"type": "dict"},
    }
    datasource = {
        "source": FILES_SOURCE,
        "projection": FILES_PROJECTION,
    }
    url = "events_files"
    item_methods = ["GET", "DELETE"]
    resource_methods = ["GET", "POST"]
    privileges = {
        "POST": "planning_event_management",
        "DELETE": "planning_event_management",
    }


class PlanningFilesResource(Resource):
    schema = {
        "media": {"type": "media"},
        "mimetype": {"type": "string"},
        "filemeta": {"type": "dict"},
    }
    datasource = {
        "source": FILES_SOURCE,
        "projection": FILES_PROJECTION,
    }
    url = "planning_files"
    item_methods = ["GET", "DELETE"]
    resource_methods = ["GET", "POST"]
    privileges = {
        "POST": "planning_planning_management",
        "DELETE": "planning_planning_management",
    }
