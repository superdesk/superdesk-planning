import logging
import datetime

from superdesk.io.feed_parsers import FileFeedParser
import pytz
import json

utc = pytz.UTC
logger = logging.getLogger(__name__)


class SuperdeskFeedParser(FileFeedParser):
    """Superdesk event specific parser.

    Feed Parser which can parse the Superdesk Event feed and convert to internal event format,
    but the firstcreated and versioncreated times are localised.
    """

    NAME = 'SuperdeskEventJson'

    label = 'Superdesk Event Json'

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
        item = {}
        if superdesk_event.get('_current_version'):
            item['current_version'] = superdesk_event['_current_version']

        if superdesk_event.get('_time_to_be_confirmed'):
            item['_time_to_be_confirmed'] = superdesk_event['_time_to_be_confirmed']

        if superdesk_event.get('internal_note'):
            item['internal_note'] = superdesk_event['internal_note']

        if superdesk_event.get('name'):
            item['name'] = superdesk_event['name']

        if superdesk_event.get('state'):
            item['state'] = superdesk_event['state']

        if superdesk_event.get('definition_short'):
            item['definition_short'] = superdesk_event['definition_short']

        if superdesk_event.get('links'):
            item['links'] = self._format_links(superdesk_event['links'])

        if superdesk_event.get('definition_long'):
            item['definition_long'] = superdesk_event['definition_long']

        if superdesk_event.get('guid'):
            item['guid'] = superdesk_event['guid']

        if superdesk_event.get('type'):
            item['type'] = superdesk_event['type']

        if superdesk_event.get('occur_status'):
            item['occur_status'] = superdesk_event['occur_status']

        if superdesk_event.get('slugline'):
            item['slugline'] = superdesk_event['slugline']

        if superdesk_event.get('ednote'):
            item['ednote'] = superdesk_event['ednote']

        if superdesk_event.get('type'):
            item['type'] = superdesk_event['type']

        if superdesk_event.get('event_contact_info'):
            item['event_contact_info'] = superdesk_event['event_contact_info']

        if superdesk_event.get('item_id'):
            item['item_id'] = superdesk_event['item_id']

        if superdesk_event.get('anpa_category'):
            item['anpa_category'] = superdesk_event['anpa_category']

        if superdesk_event.get('dates'):
            dates = superdesk_event['dates']
            item['dates'] = {
                'tz': dates['tz'],
                'start': self.datetime(dates['start']),
                'end': self.datetime(dates['end']),
            }

        if superdesk_event.get('subject'):
            item['subject'] = self._format_qcodes(superdesk_event['subject'])

        if superdesk_event.get('_created'):
            item['_created'] = superdesk_event['_created']

        if superdesk_event.get('_updated'):
            item['_updated'] = superdesk_event['_updated']

        if superdesk_event.get('versioncreated'):
            item['versioncreated'] = self.datetime(
                superdesk_event.get('versioncreated')
            )

        if superdesk_event.get('firstcreated'):
            item['firstcreated'] = self.datetime(superdesk_event['firstcreated'])

        if superdesk_event.get('place'):
            item['place'] = self._format_qcodes(superdesk_event['place'])

        return item

    def _format_qcodes(self, items):
        subjects = []
        for item in items:
            subject = {'name': item.get('name'), 'qcode': item.get('qcode')}
            if item.get('scheme'):
                subject['scheme'] = item.get('scheme')
            if item.get('service'):
                subject['service'] = item.get('service')
            subjects.append(subject)

        return subjects

    def _format_calendars(self, items):
        calendars = []
        for item in items:
            calendar = {'name': item.get('name'), 'qcode': item.get('qcode')}
            if item.get('is_active'):
                calendar['is_active'] = item.get('is_active')
            calendars.append(calendar)

        return calendars

    def _format_links(self, links):
        links = []
        for link in links:
            links.append(link)

        return links

    def datetime(self, string):
        try:
            return datetime.datetime.strptime(string, '%Y-%m-%dT%H:%M:%S+0000').replace(
                tzinfo=utc
            )
        except ValueError:
            return datetime.datetime.strptime(string, '%Y-%m-%dT%H:%M:%SZ').replace(
                tzinfo=utc
            )

    def _parse_locations(self, items):
        locations = []
        for item in items:
            location = {'name': item.get('name'), 'qcode': item.get('qcode')}
            if item.get('address'):
                location['address'] = item.get('address')
            if item.get('address'):
                location['location'] = item.get('location')
            locations.append(location)
        return locations
