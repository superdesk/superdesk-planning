import logging

from superdesk.io.feed_parsers import FileFeedParser
from superdesk import get_resource_service
from superdesk.errors import ParserError
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
                if superdesk_event.get('type') == 'event' and superdesk_event.get('guid'):
                    return True
        except Exception:
            pass
        return False

    def parse(self, file_path, provider=None):
        self.items = []
        with open(file_path, 'r') as f:
            superdesk_event = json.load(f)

            events_service = get_resource_service('events')
            existing_event = events_service.find_one(req=None, guid=superdesk_event.get('guid'))
            if existing_event:
                raise ParserError.parseMessageError(
                    "An event already exists with exact same Id. Updating events is not supported yet."
                )
        self.items.append(self._transform_from_superdesk_event(superdesk_event))
        return self.items

    def _transform_from_superdesk_event(self, superdesk_event):

        superdesk_event['_created'] = utcnow()
        superdesk_event['_updated'] = utcnow()
        superdesk_event['state'] = WORKFLOW_STATE.INGESTED
        superdesk_event['versioncreated'] = utcnow()

        superdesk_event = self.assign_from_local_cv(superdesk_event)
        superdesk_event = self.add_to_local_db(superdesk_event)

        if superdesk_event.get('subject'):
            subject_code_items = get_subjectcodeitems()

            json_qcodes = [item['qcode'] for item in superdesk_event['subject']]
            superdesk_event['subject'] = [item for item in subject_code_items if item['qcode'] in json_qcodes]

        return superdesk_event

    def ignore_fields(self, superdesk_event):
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

        for field in ignore_fields:
            superdesk_event.pop(field, '')
        return superdesk_event

    def assign_from_local_cv(self, superdesk_event):
        assign_from_local_cv = {
            'anpa_category': 'categories',
            'calendars': 'event_calendars',
            'place': 'locators',
            'occur_status': 'eventoccurstatus'
        }

        for field in assign_from_local_cv.keys():
            if superdesk_event.get(field):
                items = (
                    get_resource_service('vocabularies').find_one(
                        req=None, _id=assign_from_local_cv[field]
                    )
                    or {}
                ).get('items', [])

                if field == 'occur_status':
                    # In this case, simply assign the occur status from database if it exists.
                    # Else, keep the value in json as it is.
                    for item in items:
                        superdesk_event[field] = next(
                            (item for item in items if superdesk_event[field]['qcode'] == item['qcode']),
                            superdesk_event[field]
                        )

                else:
                    # In this case, if the qcode exists in the database, assign the item from database.
                    # Else, do not assing any value.
                    json_qcodes = [item['qcode'] for item in superdesk_event[field]]
                    superdesk_event[field] = [
                        item
                        for item in items
                        if item['qcode'] in json_qcodes
                    ]

        return superdesk_event

    def add_to_local_db(self, superdesk_event):
        """Locations and Contacts are first searched into database.

        If any existing item is found having same id, assing that item,
        else, create new item.
        """

        add_to_local_db = {
            'event_contact_info': 'contacts',
            'location': 'locations'
        }

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

            if field == 'event_contact_info':
                superdesk_event[field] = [item["_id"] for item in superdesk_event[field]]

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
