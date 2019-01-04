import json
from eve.utils import config, ParsedRequest
from superdesk import Command, command, get_resource_service, Option
from superdesk.logging import logger
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import lock, unlock

from planning.common import get_version_item_for_post


class RepublishEventsPlanning(Command):
    option_list = (
        Option('--page-size', '-p', dest='size', required=False),
    )
    page_size = 200

    def run(self, size=None):
        logger.info('Starting to republish content')

        if size:
            self.page_size = size

        lock_name = get_lock_id('planning', 'republish_content')
        if not lock(lock_name, expire=610):
            logger.info('Republish content task is already running')
            return

        try:
            self._republish_event()
            self._republish_planning()
        except Exception:
            logger.exception('Failed to republish events')
        finally:
            unlock(lock_name)

        logger.info('Completed republish events and planning.')

    def _republish(self, fetch_callback, post_callback):
        query = {
            'query': {
                'bool': {
                    'must': [
                        {'term': {'pubstatus': 'usable'}},
                        {'terms': {'state': ['scheduled', 'postponed']}}
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
                for doc in cursor:
                    try:
                        version, doc = get_version_item_for_post(doc)
                        post_callback(doc, version)
                    except Exception:
                        logger.exception('Failed to republish {}: {}'.format(doc.get('type'),
                                                                             doc.get(config.ID_FIELD)))

    def _republish_event(self):
        """Republish events"""
        logger.info('Starting to republish events')
        events_service = get_resource_service('events')
        events_post_service = get_resource_service('events_post')
        self._republish(events_service.get, events_post_service.publish_event)

    def _republish_planning(self):
        """Republish events"""
        logger.info('Starting to republish planning')
        planning_service = get_resource_service('planning')
        planning_post_service = get_resource_service('planning_post')
        self._republish(planning_service.get, planning_post_service.publish_planning)


command('planning:republish_content', RepublishEventsPlanning())
