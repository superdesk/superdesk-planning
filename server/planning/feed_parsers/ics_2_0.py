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
from superdesk.metadata.item import ITEM_TYPE, CONTENT_TYPE, GUID_FIELD, GUID_NEWSML, FORMAT, FORMATS
from superdesk.utc import utcnow
from icalendar import vRecur, vCalAddress, vGeo
from icalendar.parser import tzid_from_dt

logger = logging.getLogger(__name__)


class IcsTwoFeedParser(FileFeedParser):
    """ICS specific parser.

    Feed Parser which can parse the ICS feed and convert to internal event format,
    but the firstcreated and versioncreated times are localised.
    """

    NAME = 'ics20'

    label = 'iCalendar v2.0'

    def can_parse(self, cal):
        return True

    def parse(self, cal, provider=None):

        try:
            items = []

            for component in cal.walk():
                if component.name == "VEVENT":
                    item = {
                        ITEM_TYPE: CONTENT_TYPE.TEXT,
                        GUID_FIELD: generate_guid(type=GUID_NEWSML),
                        FORMAT: FORMATS.PRESERVED
                    }
                    item['name'] = component.get('summary')
                    item['definition_short'] = component.get('summary')
                    item['definition_long'] = component.get('description')

                    # add dates
                    # check if component .dt return date instead of datetime, if so, convert to datetime
                    dtstart = component.get('dtstart').dt
                    dtend = component.get('dtend').dt
                    dates_start = dtstart if isinstance(dtstart, datetime.datetime) \
                        else datetime.datetime.combine(dtstart, datetime.datetime.min.time())
                    dates_end = dtend if isinstance(dtend, datetime.datetime) \
                        else datetime.datetime.combine(dtend, datetime.datetime.min.time())
                    item['dates'] = {
                        'start': dates_start,
                        'end': dates_end,
                        'tz': '',
                        'recurring_rule': {}
                    }
                    # parse ics RRULE to fit eventsML recurring_rule
                    r_rule = component.get('rrule')
                    if isinstance(r_rule, vRecur):
                        r_rule_dict = vRecur.from_ical(r_rule)
                        if 'FREQ' in r_rule_dict.keys():
                            item['dates']['recurring_rule']['frequency'] = ''.join(r_rule_dict.get('FREQ'))
                        if 'INTERVAL' in r_rule_dict.keys():
                            item['dates']['recurring_rule']['interval'] = r_rule_dict.get('INTERVAL')[0]
                        if 'UNTIL' in r_rule_dict.keys():
                            item['dates']['recurring_rule']['until'] = r_rule_dict.get('UNTIL')[0]
                        if 'COUNT' in r_rule_dict.keys():
                            item['dates']['recurring_rule']['count'] = r_rule_dict.get('COUNT')
                        if 'BYMONTH' in r_rule_dict.keys():
                            item['dates']['recurring_rule']['bymonth'] = ' '.join(r_rule_dict.get('BYMONTH'))
                        if 'BYDAY' in r_rule_dict.keys():
                            item['dates']['recurring_rule']['byday'] = ' '.join(r_rule_dict.get('BYDAY'))
                        if 'BYHOUR' in r_rule_dict.keys():
                            item['dates']['recurring_rule']['byhour'] = ' '.join(r_rule_dict.get('BYHOUR'))
                        if 'BYMIN' in r_rule_dict.keys():
                            item['dates']['recurring_rule']['bymin'] = ' '.join(r_rule_dict.get('BYMIN'))

                    # set timezone info if date is a datetime
                    if isinstance(component.get('dtstart').dt, datetime.datetime):
                        item['dates']['tz'] = tzid_from_dt(component.get('dtstart').dt)

                    # add participants
                    item['participants'] = []
                    if component.get('attendee'):
                        for attendee in component.get('attendee'):
                            if isinstance(attendee, vCalAddress):
                                item['participants'].append({
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

                    logger.info("Ingesting Event: %sn", item)
                    items.append(item)

            return items
        except Exception as ex:
            raise ParserError.parseMessageError(ex, provider)
