import logging

from superdesk.io.feed_parsers import FileFeedParser
from superdesk import get_resource_service
from superdesk.utc import utcnow
from planning.common import WORKFLOW_STATE
import pytz
import json
import datetime

utc = pytz.UTC
logger = logging.getLogger(__name__)


class EventJsonFeedParser(FileFeedParser):
    """Superdesk event specific parser.

    Feed Parser which can parse the Superdesk Event feed and convert to internal event format,
    but the firstcreated and versioncreated times are localised.
    """

    NAME = 'json_event'

    label = 'Json Event'

    def can_parse(self, file_path):
        try:
            with open(file_path, 'r') as f:
                superdesk_event = json.load(f)
                if superdesk_event.get('guid'):
                    return True
        except Exception:
            pass
        return False

    def parse(self, file_path, provider=None):
        self.items = []
        with open(file_path, 'r') as f:
            superdesk_event = json.load(f)
        self.items.append(self._transform_from_superdesk_event(superdesk_event))
        return self.items

    def _transform_from_superdesk_event(self, superdesk_event):
        ignore_fields = [
            'files',
            'state_reason',
            'schedule_settings',
            'pubstatus',
            '_current_version',
            '_id',
            'item_id',
            'actioned_date'
        ]

        assign_from_local_cv = [
            'anpa_category',
            'subject',
            'calendars',
            'place',
            'occur_status'
        ]

        add_to_local_db = [
            'event_contact_info',
            'location'
        ]

        for field in ignore_fields:
            superdesk_event.pop(field, '')

        superdesk_event['_created'] = utcnow()
        superdesk_event['_updated'] = utcnow()
        superdesk_event['state'] = WORKFLOW_STATE.INGESTED

        for field in assign_from_local_cv:
            if field == 'occur_status':
                items = (
                    get_resource_service("vocabularies").find_one(
                        req=None, _id="eventoccurstatus"
                    )
                    or {}
                ).get("items", [])
                for item in items:
                    if item['qcode'] in [item['qcode'] for item in items]:
                        superdesk_event[field] = item
                    else:
                        superdesk_event[field] = superdesk_event[field]

            else:
                items = (get_resource_service('vocabularies').find_one(req=None, _id=field) or {}).get('items', [])
                for item in items:
                    if item['qcode'] in [item['qcode'] for item in items]:
                        superdesk_event[field] = item
                    else:
                        superdesk_event[field] = {}

        for field in add_to_local_db:
            items = []
            if field == 'event_contact_info':
                items = superdesk_event.get('event_contact_info', [])
                category = 'contacts'

            elif field == 'location':
                items = superdesk_event.get('location', [])
                category = 'locations'
                for item in items:
                    item['_id'] = item.get('qcode')

            for item in items:
                if item.get('_id'):
                    contact = get_resource_service(category).find_one(req=None, _id=item.get('_id'))
                    if not contact:
                        get_resource_service(category).post([item])

        superdesk_event['versioncreated'] = self.datetime(superdesk_event['versioncreated'])

        return superdesk_event

    def datetime(self, string):
        try:
            return datetime.datetime.strptime(string, '%Y-%m-%dT%H:%M:%S+0000').replace(
                tzinfo=utc
            )
        except ValueError:
            return datetime.datetime.strptime(string, '%Y-%m-%dT%H:%M:%SZ').replace(
                tzinfo=utc
            )
