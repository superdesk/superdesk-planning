import logging

from superdesk.io.feed_parsers import FileFeedParser
from superdesk import get_resource_service
from superdesk.io.subjectcodes import get_subjectcodeitems
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

        assign_from_local_cv = {
            'anpa_category': 'categories',
            'calendars': 'event_calendars',
            'place': 'locators',
            'occur_status': 'eventoccurstatus'
        }

        add_to_local_db = {
            'event_contact_info': 'contacts',
            'location': 'locations'
        }

        for field in ignore_fields:
            superdesk_event.pop(field, '')

        superdesk_event['_created'] = utcnow()
        superdesk_event['_updated'] = utcnow()
        superdesk_event['state'] = WORKFLOW_STATE.INGESTED

        for field in assign_from_local_cv.keys():
            if superdesk_event.get(field):
                items = (
                    get_resource_service('vocabularies').find_one(
                        req=None, _id=assign_from_local_cv[field]
                    )
                    or {}
                ).get('items', [])

                if field == 'occur_status':
                    for item in items:
                        if superdesk_event[field]['qcode'] == item['qcode']:
                            superdesk_event[field] = item
                        else:
                            superdesk_event[field] = superdesk_event[field]
                else:
                    superdesk_event_field = []
                    for event in superdesk_event[field]:
                        for item in items:
                            if event['qcode'] == item['qcode']:
                                superdesk_event_field.append(item)
                    superdesk_event[field] = superdesk_event_field

        if superdesk_event.get('subject'):
            superdesk_event_subject = []
            subject_code_items = get_subjectcodeitems()

            for item in superdesk_event['subject']:
                for subject_item in subject_code_items:
                    if item.get('qcode') == subject_item['qcode']:
                        superdesk_event_subject.append(subject_item)
            superdesk_event['subject'] = superdesk_event_subject

        for field in add_to_local_db.keys():
            items = superdesk_event.get(field, [])

            for item in items:
                if field == 'location':
                    item['_id'] = item.get('qcode')
                if item.get('_id'):
                    field_in_database = get_resource_service(
                        add_to_local_db[field]
                    ).find_one(req=None, _id=item.get('_id'))
                    if not field_in_database:
                        get_resource_service(add_to_local_db[field]).post([item])

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
