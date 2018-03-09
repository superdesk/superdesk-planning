from planning.events.events import generate_recurring_dates
import datetime
import pytz
from superdesk import get_resource_service
from superdesk.utc import utcnow
from planning.tests import TestCase
from planning.common import format_address


class EventTestCase(TestCase):
    def test_recurring_dates_generation(self):
        # Every other thurdsay and friday afternoon on January 2016
        self.assertEquals(list(generate_recurring_dates(
            start=datetime.datetime(2016, 1, 1, 15, 0),
            frequency='WEEKLY',
            byday='TH FR',
            interval=2,
            until=datetime.datetime(2016, 2, 1),
            endRepeatMode='until',
        )), [
            datetime.datetime(2016, 1, 1, 15, 0),  # friday 1st
            datetime.datetime(2016, 1, 14, 15, 0),  # thursday 14th
            datetime.datetime(2016, 1, 15, 15, 0),  # friday 15th
            datetime.datetime(2016, 1, 28, 15, 0),  # thursday 28th
            datetime.datetime(2016, 1, 29, 15, 0),  # friday 29th
        ])
        # Every working day
        self.assertEquals(list(generate_recurring_dates(
            start=datetime.datetime(2016, 1, 1),
            frequency='WEEKLY',
            byday='MO TU WE TH FR',
            count=5,
            endRepeatMode='count',
        )), [
            datetime.datetime(2016, 1, 1),  # friday
            datetime.datetime(2016, 1, 4),  # monday
            datetime.datetime(2016, 1, 5),
            datetime.datetime(2016, 1, 6),
            datetime.datetime(2016, 1, 7),
        ])
        # Next 4 Summer Olympics
        self.assertEquals(list(generate_recurring_dates(
            start=datetime.datetime(2016, 1, 2),
            frequency='YEARLY',
            interval=4,
            count=4,
            endRepeatMode='count',
        )), [
            datetime.datetime(2016, 1, 2),
            datetime.datetime(2020, 1, 2),
            datetime.datetime(2024, 1, 2),
            datetime.datetime(2028, 1, 2)
        ])
        # All my birthdays
        my_birthdays = generate_recurring_dates(
            start=datetime.datetime(1989, 12, 13),
            frequency='YEARLY',
            endRepeatMode='count',
            count=200
        )
        self.assertTrue(datetime.datetime(1989, 12, 13) in my_birthdays)
        self.assertTrue(datetime.datetime(2016, 12, 13) in my_birthdays)
        self.assertTrue(datetime.datetime(2179, 12, 13) in my_birthdays)
        # Time zone
        self.assertEquals(list(generate_recurring_dates(
            start=datetime.datetime(2016, 11, 17, 23, 00),
            frequency='WEEKLY',
            byday='FR',
            count=3,
            endRepeatMode='count',
            tz=pytz.timezone('Europe/Berlin')
        )), [
            datetime.datetime(2016, 11, 17, 23, 00),  # it's friday in Berlin
            datetime.datetime(2016, 11, 24, 23, 00),  # it's friday in Berlin
            datetime.datetime(2016, 12, 1, 23, 00),  # it's friday in Berlin
        ])

    def test_get_recurring_timeline(self):
        with self.app.app_context():
            generated_events = generate_recurring_events(10)
            self.app.data.insert('events', generated_events)

            service = get_resource_service('events')
            selected = service.find_one(req=None, name='Event 5')
            self.assertEquals('Event 5', selected['name'])

            (historic, past, future) = service.get_recurring_timeline(selected)

            self.assertEquals(2, len(historic))
            self.assertEquals(3, len(past))
            self.assertEquals(4, len(future))

            expected_time = generated_events[0]['dates']['start']
            for e in historic:
                self.assertEquals(e['dates']['start'], expected_time)
                expected_time += datetime.timedelta(days=1)

            for e in past:
                self.assertEquals(e['dates']['start'], expected_time)
                expected_time += datetime.timedelta(days=1)

            self.assertEquals(selected['dates']['start'], expected_time)
            expected_time += datetime.timedelta(days=1)

            for e in future:
                self.assertEquals(e['dates']['start'], expected_time)
                expected_time += datetime.timedelta(days=1)


class EventLocationFormatAddress(TestCase):
    def test_format_address(self):
        location = {
            'address': {
                'postal_code': '2150',
                'line': ['The Pub'],
                'area': 'Parramatta',
                'locality': 'Sydney',
                'country': 'Australia'
            },
            'name': 'Parramatta',
            'location': {
                'lat': -33.8139843,
                'lon': 151.002666
            },
            'qcode': 'urn:newsml:localhost:2017-11-28T13:21:06.571812:1ce975e9-19c2-4fad-9cd6-8cda4020e565'
        }

        format_address(location)
        self.assertEqual(location['formatted_address'], 'The Pub Parramatta Sydney 2150 Australia')

        location = {
            "address": {
                "line": [""],
            },
            "name": "Parramatta",
            "location": {
                "lat": -33.8139843,
                "lon": 151.002666
            },
            "qcode": "urn:newsml:localhost:2017-11-28T13:21:06.571812:1ce975e9-19c2-4fad-9cd6-8cda4020e565"
        }

        format_address(location)
        self.assertEqual(location['formatted_address'], '')

        location = {
            "address": {},
            "name": "Parramatta",
            "location": {
                "lat": -33.8139843,
                "lon": 151.002666
            },
            "qcode": "urn:newsml:localhost:2017-11-28T13:21:06.571812:1ce975e9-19c2-4fad-9cd6-8cda4020e565"
        }

        format_address(location)
        self.assertEqual(location['formatted_address'], '')

        location = {
            "address": {"line": []},
            "name": "Parramatta",
            "location": {
                "lat": -33.8139843,
                "lon": 151.002666
            },
            "qcode": "urn:newsml:localhost:2017-11-28T13:21:06.571812:1ce975e9-19c2-4fad-9cd6-8cda4020e565"
        }

        format_address(location)
        self.assertEqual(location['formatted_address'], '')


def generate_recurring_events(num_events):
    events = []
    days = -2
    now = utcnow()
    for i in range(num_events):
        start = now + datetime.timedelta(days=days)
        end = start + datetime.timedelta(hours=4)
        events.append({
            'slugline': 'Event',
            'name': 'Event {}'.format(i),
            'recurrence_id': 'rec1',
            'dates': {
                'start': start,
                'end': end
            }
        })
        days += 1
    return events
