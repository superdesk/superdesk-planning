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
import datetime

from superdesk.errors import ParserError
from superdesk.io.feed_parsers import FileFeedParser
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import ITEM_TYPE, CONTENT_TYPE, GUID_FIELD, GUID_NEWSML, FORMAT, FORMATS, CONTENT_STATE
from superdesk.utc import utcnow, local_to_utc
from eve.utils import config
from icalendar import vRecur, vCalAddress, vGeo
from icalendar.parser import tzid_from_dt
from superdesk import get_resource_service
import pytz
from icalendar import Calendar
from planning.common import get_max_recurrent_events

utc = pytz.UTC
logger = logging.getLogger(__name__)


class IcsTwoFeedParser(FileFeedParser):
    """ICS specific parser.

    Feed Parser which can parse the ICS feed and convert to internal event format,
    but the firstcreated and versioncreated times are localised.
    """

    NAME = 'ics20'

    label = 'iCalendar v2.0'

    def can_parse(self, cal):
        return isinstance(cal, Calendar)

    def parse_email(self, content, content_type, provider):
        if content_type != 'text/calendar':
            raise ParserError.parseMessageError('Not supported content type.')

        content.seek(0)
        cal = Calendar.from_ical(content.read())
        return self.parse(cal, provider)

    def parse_file(self, fstream, provider):
        cal = Calendar.from_ical(fstream.read())
        return self.parse(cal, provider)

    def parse_http(self, content, provider):
        cal = Calendar.from_ical(content)
        return self.parse(cal, provider)

    def parse(self, cal, provider=None):

        try:
            items = []

            for component in cal.walk():
                if component.name == "VEVENT":
                    item = {
                        ITEM_TYPE: CONTENT_TYPE.EVENT,
                        GUID_FIELD: generate_guid(type=GUID_NEWSML),
                        FORMAT: FORMATS.PRESERVED
                    }
                    item['name'] = component.get('summary')
                    item['definition_short'] = component.get('summary')
                    item['definition_long'] = component.get('description')
                    item['original_source'] = component.get('uid')
                    item['state'] = CONTENT_STATE.INGESTED
                    item['pubstatus'] = None
                    eocstat_map = get_resource_service('vocabularies').find_one(req=None, _id='eventoccurstatus')
                    if eocstat_map:
                        item['occur_status'] = [x for x in eocstat_map.get('items', []) if
                                                x['qcode'] == 'eocstat:eos5' and x.get('is_active', True)][0]
                        item['occur_status'].pop('is_active', None)

                    self.parse_dates(item, component)
                    self.parse_recurring_rules(item, component)

                    # add participants
                    item['participant'] = []
                    if component.get('attendee'):
                        for attendee in component.get('attendee'):
                            if isinstance(attendee, vCalAddress):
                                item['participant'].append({
                                    'name': vCalAddress.from_ical(attendee),
                                    'qcode': ''
                                })

                    # add organizers
                    item['organizer'] = [{
                        'name': component.get('organizer', ''),
                        'qcode': ''
                    }]

                    # add location
                    item['location'] = [{
                        'name': component.get('location', ''),
                        'qcode': '',
                        'geo': ''
                    }]
                    if component.get('geo'):
                        item['location'][0]['geo'] = vGeo.from_ical(component.get('geo').to_ical())

                    # IMPORTANT: firstcreated must be less than 2 days past
                    # we must preserve the original event created and updated in some other fields
                    if component.get('created'):
                        item['event_created'] = component.get('created').dt
                    if component.get('last-modified'):
                        item['event_lastmodified'] = component.get('last-modified').dt
                    item['firstcreated'] = utcnow()
                    item['versioncreated'] = utcnow()
                    items.append(item)
            original_source_ids = [_['original_source'] for _ in items if _.get('original_source', None)]
            existing_items = list(get_resource_service('events').get_from_mongo(req=None, lookup={
                'original_source': {'$in': original_source_ids}
            }))

            def original_source_exists(item):
                """Return true if the item exists in `existing_items`"""
                for c in existing_items:
                    if c['original_source'] == item['original_source']:
                        if c['dates']['start'] == item['dates']['start']:
                            return True
                return False

            def is_future(item):
                """Return true if the item is reccuring or in the future"""
                if not item['dates'].get('recurring_rule'):
                    if item['dates']['start'] < utcnow() - datetime.timedelta(days=1):
                        return False
                return True

            items = [_ for _ in items if is_future(_)]
            items = [_ for _ in items if not original_source_exists(_)]
            return items
        except Exception as ex:
            raise ParserError.parseMessageError(ex, provider)

    def parse_dates(self, item, component):
        """Extracts date information from ICS into the Event item

        :param item: The Event item
        :param component: An ICS VEVENT component
        """

        # add dates
        # check if component .dt return date instead of datetime, if so, convert to datetime
        dtstart = component.get('dtstart').dt
        dates_start = dtstart if isinstance(dtstart, datetime.datetime) \
            else datetime.datetime.combine(dtstart, datetime.datetime.min.time())

        if not dates_start.tzinfo:
            dates_start = local_to_utc(config.DEFAULT_TIMEZONE, dates_start)

        try:
            dtend = component.get('dtend').dt
            if isinstance(dtend, datetime.datetime):
                dates_end = dtend
            else:  # Date only is non inclusive
                dates_end = \
                    (datetime.datetime.combine(dtend, datetime.datetime.max.time()) -
                     datetime.timedelta(days=1)).replace(microsecond=0)
            if not dates_end.tzinfo:
                dates_end = local_to_utc(config.DEFAULT_TIMEZONE, dates_end)
        except AttributeError:
            dates_end = None

        item['dates'] = {
            'start': dates_start,
            'end': dates_end,
            'tz': ''
        }

        # set timezone info if date is a datetime
        if isinstance(component.get('dtstart').dt, datetime.datetime):
            item['dates']['tz'] = tzid_from_dt(component.get('dtstart').dt)

    def parse_recurring_rules(self, item, component):
        """Extracts ICS RRULE into the Event item

        :param item: The Event item
        :param component: An ICS VEVENT component
        """

        # parse ics RRULE to fit eventsML recurring_rule
        r_rule = component.get('rrule')
        if not isinstance(r_rule, vRecur):
            return

        r_rule_dict = vRecur.from_ical(r_rule)
        recurring_rule = {}

        if r_rule.get('FREQ'):
            recurring_rule['frequency'] = ''.join(r_rule_dict['FREQ'])
        if len(r_rule.get('INTERVAL') or []):
            recurring_rule['interval'] = r_rule_dict['INTERVAL'][0]
        if len(r_rule.get('UNTIL') or []):
            recurring_rule['until'] = r_rule_dict['UNTIL'][0]
        if r_rule.get('COUNT'):
            recurring_rule['count'] = r_rule_dict['COUNT']
        if r_rule.get('BYMONTH'):
            recurring_rule['bymonth'] = ' '.join(r_rule_dict['BYMONTH'])
        if r_rule.get('BYDAY'):
            recurring_rule['byday'] = ' '.join(r_rule_dict['BYDAY'])
        if r_rule.get('BYHOUR'):
            recurring_rule['byhour'] = ' '.join(r_rule_dict['BYHOUR'])
        if r_rule.get('BYMIN'):
            recurring_rule['bymin'] = ' '.join(r_rule_dict['BYMIN'])

        if recurring_rule.get('count'):
            recurring_rule['endRepeatMode'] = 'count'
        elif recurring_rule.get('until'):
            recurring_rule['endRepeatMode'] = 'until'

            # If the `until` attribute is just a date
            # then copy the time/tzinfo from `dates.end` attribute
            if isinstance(recurring_rule['until'], datetime.date):
                end_date = item['dates']['end']
                recurring_rule['until'] = datetime.datetime.combine(
                    recurring_rule['until'],
                    end_date.time(),
                    end_date.tzinfo
                )
        else:
            # If the calendar does not provide an end date
            # then set `count` to MAX_RECURRENT_EVENTS settings
            recurring_rule['count'] = get_max_recurrent_events()
            recurring_rule['endRepeatMode'] = 'count'

        item['dates']['recurring_rule'] = recurring_rule
