import json
import click

from superdesk.commands import cli
from superdesk.resource_fields import VERSION
from superdesk.logging import logger
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import lock, unlock
from superdesk.utils import json_serialize_datetime_objectId
from superdesk.publish.transmitters.http_push import HTTPPushService
from planning.common import get_version_item_for_post
from planning.output_formatters import JsonPlanningFormatter, JsonEventFormatter
from planning.types.unified import UnifiedPlanningResource


class NewsroomHTTPTransmitter(HTTPPushService):
    def transmit(self, queue_item):
        try:
            self._transmit(queue_item, None)
            logger.info("Successfully transmitted item {}".format(queue_item.get("item_id")))
        except Exception:
            logger.exception("Failed to transmit the item {}.".format(queue_item.get("item_id")))


@cli.command("planning:export_to_newsroom")
@click.option("--resource-url", "-u", required=True)
@click.option("--assets-url", "-a", required=True)
@click.option("--page-size", "-p", required=False)
async def export_to_newroom_command(resource_url, assests_url, size=None):
    """
    Exports `Events` and `Planning` to Newsroom.

    resource-url: resource url of the Newsroom website
    assets-url: assets url of the Newsroom website
    page-size: No. of documents to process in a batch. Default is 200.
    Example:
    ::

        $ python manage.py planning:export_to_newsroom --resource-url=http://<host>:<port>/<path>
        --assets-url=http://<host>:<port>/<path> --page-size=200

    """
    await ExportToNewsroom().run(resource_url, assests_url, size)


class ExportToNewsroom:
    page_size = 200
    # dummy subscriber
    subscriber = {"is_active": True, "_id": 1}
    resource_url = None
    assets_url = None

    async def run(self, resource_url, assets_url, size=None):
        logger.info("Starting to export content")

        if size:
            self.page_size = size

        self.resource_url = resource_url
        self.assets_url = assets_url

        lock_name = get_lock_id("planning", "export_to_newsroom")
        if not lock(lock_name, expire=610):
            logger.info("export to newsroom task is already running")
            return

        try:
            await self._export_events()
            await self._export_planning()
        except Exception:
            logger.exception("Failed to export events and planning")
        finally:
            unlock(lock_name)

        logger.info("Completed export events and planning.")

    async def _fetch_items(self, item_type):
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"type": item_type}},
                        {"term": {"pubstatus": "usable"}},
                        {"terms": {"state": ["scheduled", "postponed", "rescheduled"]}},
                    ]
                }
            },
            "sort": [{"versioncreated": {"order": "asc"}}],
        }
        service = UnifiedPlanningResource.get_service()
        async for item in service.get_all_batch_elastic_raw(query, size=self.page_size):
            yield item

    async def _export_events(self):
        """Export events"""
        logger.info("Starting to export events")

        formatter = JsonEventFormatter()
        destination = self._get_destination("json_event")
        formatter.set_destination(destination=destination, subscriber=self.subscriber)
        transmitter = NewsroomHTTPTransmitter()
        async for item in self._fetch_items("event"):
            try:
                logger.info("Processing event item: {}".format(item.get("_id")))
                version, event = get_version_item_for_post(item)
                queue_item = self._get_queue_item(event, formatter._format_item, destination)
                transmitter.transmit(queue_item)
                logger.info("Processing processed item: {}".format(item.get("_id")))
            except Exception:
                logger.exception("Failed to export event: {}".format(item.get("_id")))

    async def _export_planning(self):
        """Export planning"""
        logger.info("Starting to export planning")

        formatter = JsonPlanningFormatter()
        destination = self._get_destination("json_planning")
        formatter.set_destination(destination=destination, subscriber=self.subscriber)
        transmitter = NewsroomHTTPTransmitter()
        async for item in self._fetch_items("planning"):
            try:
                logger.info("Processing planning item: {}".format(item.get("_id")))
                version, plan = get_version_item_for_post(item)
                queue_item = self._get_queue_item(plan, formatter._format_item, destination)
                transmitter.transmit(queue_item)
                logger.info("Processed planning item: {}".format(item.get("item_id")))
            except Exception:
                logger.exception("Failed to export planning item: {}".format(item.get("_id")))

    def _get_queue_item(self, item, format_callback, destination):
        """Get the queue item

        :param dict item: item to transmit
        :param func format_callback: callback to format the item
        :param dict destination: destination for the queue item
        """
        return {
            "item_id": item.get("item_id"),
            "item_version": item.get(VERSION),
            "subscriber_id": self.subscriber.get("_id"),
            "destination": destination,
            "formatted_item": json.dumps(format_callback(item), default=json_serialize_datetime_objectId),
            "content_type": item.get("type"),
        }

    def _get_destination(self, destionation_format):
        """Get the destination

        :param str destionation_format: destination format as `json_event` or `json_planning`
        """
        return {
            "delivery_type": "http_push",
            "format": destionation_format,
            "config": {
                "resource_url": self.resource_url,
                "assets_url": self.assets_url,
            },
            "name": destionation_format,
        }
