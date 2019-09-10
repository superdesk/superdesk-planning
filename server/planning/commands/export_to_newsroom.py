import json

from eve.utils import config, ParsedRequest
from superdesk import Command, command, get_resource_service, Option
from superdesk.logging import logger
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import lock, unlock
from superdesk.utils import json_serialize_datetime_objectId
from superdesk.publish.transmitters.http_push import HTTPPushService
from planning.common import get_version_item_for_post
from planning.output_formatters import JsonPlanningFormatter, JsonEventFormatter


class NewsroomHTTPTransmitter(HTTPPushService):
    def transmit(self, queue_item):
        try:
            self._transmit(queue_item, None)
            logger.info('Successfully transmitted item {}'.format(queue_item.get('item_id')))
        except Exception:
            logger.exception("Failed to transmit the item {}.".format(queue_item.get('item_id')))


class ExportToNewsroom(Command):
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

    option_list = (
        Option('--resource-url', '-u', dest='resource_url', required=True),
        Option('--assets-url', '-a', dest='assets_url', required=True),
        Option('--page-size', '-p', dest='size', required=False),
    )
    page_size = 200

    # dummy subscriber
    subscriber = {
        'is_active': True,
        '_id': 1
    }

    resource_url = None
    assets_url = None

    def run(self, resource_url, assets_url, size=None):
        logger.info('Starting to export content')

        if size:
            self.page_size = size

        self.resource_url = resource_url
        self.assets_url = assets_url

        lock_name = get_lock_id('planning', 'export_to_newsroom')
        if not lock(lock_name, expire=610):
            logger.info('export to newsroom task is already running')
            return

        try:
            self._export_events()
            self._export_planning()
        except Exception:
            logger.exception('Failed to export events and planning')
        finally:
            unlock(lock_name)

        logger.info('Completed export events and planning.')

    def _fetch_items(self, fetch_callback):
        """"""
        query = {
            'query': {
                'bool': {
                    'must': [
                        {'term': {'pubstatus': 'usable'}},
                        {'terms': {'state': ['scheduled', 'postponed', 'rescheduled']}}
                    ]
                }
            },
            'sort': [
                {'versioncreated': {'order': 'asc'}}
            ],
            'size': 0
        }
        req = ParsedRequest()
        req.args = {'source': json.dumps(query)}
        cursor = fetch_callback(req=req, lookup=None)
        total_documents = cursor.count()

        if total_documents > 0:
            query['size'] = self.page_size
            total_pages = len(range(0, total_documents, self.page_size))
            for page_num in range(0, total_pages):
                query['from'] = page_num * self.page_size
                req = ParsedRequest()
                req.args = {'source': json.dumps(query)}
                cursor = fetch_callback(req=req, lookup=None)
                yield list(cursor)

    def _export_events(self):
        """Export events"""
        logger.info('Starting to export events')
        events_service = get_resource_service('events')

        formatter = JsonEventFormatter()
        destination = self._get_destination('json_event')
        formatter.set_destination(destination=destination, subscriber=self.subscriber)
        transmitter = NewsroomHTTPTransmitter()
        for items in self._fetch_items(events_service.get):
            for item in items:
                try:
                    logger.info('Processing event item: {}'.format(item.get('_id')))
                    version, event = get_version_item_for_post(item)
                    queue_item = self._get_queue_item(event, formatter._format_item, destination)
                    transmitter.transmit(queue_item)
                    logger.info('Processing processed item: {}'.format(item.get('_id')))
                except Exception:
                    logger.exception('Failed to export event: {}'.format(item.get('_id')))

    def _export_planning(self):
        """Export events"""
        logger.info('Starting to export planning')
        planning_service = get_resource_service('planning')

        formatter = JsonPlanningFormatter()
        destination = self._get_destination('json_planning')
        formatter.set_destination(destination=destination, subscriber=self.subscriber)
        transmitter = NewsroomHTTPTransmitter()
        for items in self._fetch_items(planning_service.get):
            for item in items:
                try:
                    logger.info('Processing planning item: {}'.format(item.get('_id')))
                    version, plan = get_version_item_for_post(item)
                    queue_item = self._get_queue_item(plan, formatter._format_item, destination)
                    transmitter.transmit(queue_item)
                    logger.info('Processed planning item: {}'.format(item.get('item_id')))
                except Exception:
                    logger.exception('Failed to export planning item: {}'.format(item.get('_id')))

    def _get_queue_item(self, item, format_callback, destination):
        """Get the queue item

        :param dict item: item to transmit
        :param func format_callback: callback to format the item
        :param dict destination: destination for the queue item
        """
        return {
            'item_id': item.get('item_id'),
            'item_version': item.get(config.VERSION),
            'subscriber_id': self.subscriber.get('_id'),
            'destination': destination,
            'formatted_item': json.dumps(format_callback(item), default=json_serialize_datetime_objectId),
            'content_type': item.get('type')
        }

    def _get_destination(self, destionation_format):
        """Get the destination

        :param str destionation_format: destination format as `json_event` or `json_planning`
        """
        return {
            'delivery_type': 'http_push',
            'format': destionation_format,
            'config': {
                'resource_url': self.resource_url,
                'assets_url': self.assets_url
            },
            'name': destionation_format
        }


command('planning:export_to_newsroom', ExportToNewsroom())
