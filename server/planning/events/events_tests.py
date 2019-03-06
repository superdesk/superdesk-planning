from datetime import datetime, timedelta
import pytz
from copy import deepcopy
from mock import Mock, patch
from superdesk import get_resource_service
from superdesk.utc import utcnow
from planning.tests import TestCase
from planning.common import format_address
from planning.item_lock import LockService
from planning.events.events import generate_recurring_dates


class EventTestCase(TestCase):
    def test_recurring_dates_generation(self):
        # Every other thurdsay and friday afternoon on January 2016
        self.assertEquals(list(generate_recurring_dates(
            start=datetime(2016, 1, 1, 15, 0),
            frequency='WEEKLY',
            byday='TH FR',
            interval=2,
            until=datetime(2016, 2, 1),
            endRepeatMode='until',
        )), [
            datetime(2016, 1, 1, 15, 0),  # friday 1st
            datetime(2016, 1, 14, 15, 0),  # thursday 14th
            datetime(2016, 1, 15, 15, 0),  # friday 15th
            datetime(2016, 1, 28, 15, 0),  # thursday 28th
            datetime(2016, 1, 29, 15, 0),  # friday 29th
        ])
        # Every working day - 2 cycles
        self.assertEquals(list(generate_recurring_dates(
            start=datetime(2016, 1, 1),
            frequency='WEEKLY',
            byday='MO TU WE TH FR',
            count=2,
            endRepeatMode='count',
        )), [
            datetime(2016, 1, 1),  # friday
            datetime(2016, 1, 4),  # monday
            datetime(2016, 1, 5),
            datetime(2016, 1, 6),
            datetime(2016, 1, 7),
            datetime(2016, 1, 8),  # friday again
            datetime(2016, 1, 11),
            datetime(2016, 1, 12),
            datetime(2016, 1, 13),
            datetime(2016, 1, 14),
        ])
        # Next 4 Summer Olympics
        self.assertEquals(list(generate_recurring_dates(
            start=datetime(2016, 1, 2),
            frequency='YEARLY',
            interval=4,
            count=4,
            endRepeatMode='count',
        )), [
            datetime(2016, 1, 2),
            datetime(2020, 1, 2),
            datetime(2024, 1, 2),
            datetime(2028, 1, 2)
        ])
        # All my birthdays
        my_birthdays = generate_recurring_dates(
            start=datetime(1989, 12, 13),
            frequency='YEARLY',
            endRepeatMode='count',
            count=200
        )
        self.assertTrue(datetime(1989, 12, 13) in my_birthdays)
        self.assertTrue(datetime(2016, 12, 13) in my_birthdays)
        self.assertTrue(datetime(2179, 12, 13) in my_birthdays)
        # Time zone
        self.assertEquals(list(generate_recurring_dates(
            start=datetime(2016, 11, 17, 23, 00),
            frequency='WEEKLY',
            byday='FR',
            count=3,
            endRepeatMode='count',
            tz=pytz.timezone('Europe/Berlin')
        )), [
            datetime(2016, 11, 17, 23, 00),  # it's friday in Berlin
            datetime(2016, 11, 24, 23, 00),  # it's friday in Berlin
            datetime(2016, 12, 1, 23, 00),  # it's friday in Berlin
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
                expected_time += timedelta(days=1)

            for e in past:
                self.assertEquals(e['dates']['start'], expected_time)
                expected_time += timedelta(days=1)

            self.assertEquals(selected['dates']['start'], expected_time)
            expected_time += timedelta(days=1)

            for e in future:
                self.assertEquals(e['dates']['start'], expected_time)
                expected_time += timedelta(days=1)


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


class EventPlanningSchedule(TestCase):

    def assertPlanningSchedule(self, events, event_count):
        self.assertEqual(len(events), event_count)
        for evt in events:
            self.assertEqual(
                evt.get('dates').get('start'),
                evt.get('_planning_schedule')[0].get('scheduled')
            )

    def test_planning_schedule_for_recurring_event(self):
        with self.app.app_context():
            service = get_resource_service('events')
            event = {
                'name': 'Friday Club',
                'dates': {
                    'start': datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                    'end': datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                    'tz': 'Australia/Sydney',
                    'recurring_rule': {
                        'frequency': 'DAILY',
                        'interval': 1,
                        'count': 3,
                        'endRepeatMode': 'count'
                    }
                }
            }

            service.post([event])
            events = list(service.get(req=None, lookup=None))
            self.assertPlanningSchedule(events, 3)

    def test_planning_schedule_reschedule_event(self):
        with self.app.app_context():
            service = get_resource_service('events')
            event = {
                'name': 'Friday Club',
                'dates': {
                    'start': datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                    'end': datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                    'tz': 'Australia/Sydney',
                    'recurring_rule': {
                        'frequency': 'DAILY',
                        'interval': 1,
                        'count': 3,
                        'endRepeatMode': 'count'
                    }
                }
            }

            # create recurring events
            service.post([event])
            events = list(service.get(req=None, lookup=None))
            self.assertPlanningSchedule(events, 3)

            # reschedule recurring event before posting
            schedule = deepcopy(events[0].get('dates'))
            schedule['start'] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=5)
            schedule['end'] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=5)

            reschedule = get_resource_service('events_reschedule')
            reschedule.REQUIRE_LOCK = False
            # mocking function
            is_original_event_func = reschedule.is_original_event
            reschedule.is_original_event = Mock(return_value=False)

            res = reschedule.patch(events[0].get('_id'), {'dates': schedule})
            self.assertEqual(res.get('dates').get('start'), schedule['start'])

            events = list(service.get(req=None, lookup=None))
            self.assertPlanningSchedule(events, 3)

            # post recurring events
            get_resource_service('events_post').post([
                {
                    'event': events[0].get('_id'),
                    'etag': events[0].get('etag'),
                    'pubstatus': 'usable',
                    'update_method': 'all'
                }
            ])

            # reschedule posted recurring event
            schedule = deepcopy(events[0].get('dates'))
            schedule['start'] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=3)
            schedule['end'] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=3)

            res = reschedule.patch(events[0].get('_id'), {'dates': schedule})
            rescheduled_event = service.find_one(req=None, _id=events[0].get('_id'))
            self.assertNotEqual(rescheduled_event.get('dates').get('start'), schedule['start'])

            events = list(service.get(req=None, lookup=None))
            self.assertPlanningSchedule(events, 4)

            # reset mocked function
            reschedule.is_original_event = is_original_event_func
            reschedule.REQUIRE_LOCK = True

    def test_planning_schedule_update_time(self):
        with self.app.app_context():
            service = get_resource_service('events')
            event = {
                'name': 'Friday Club',
                'dates': {
                    'start': datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                    'end': datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                    'tz': 'Australia/Sydney',
                    'recurring_rule': {
                        'frequency': 'DAILY',
                        'interval': 1,
                        'count': 3,
                        'endRepeatMode': 'count'
                    }
                }
            }

            service.post([event])
            events = list(service.get(req=None, lookup=None))
            self.assertPlanningSchedule(events, 3)

            schedule = deepcopy(events[0].get('dates'))
            schedule['start'] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)
            schedule['end'] = datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)

            update_time = get_resource_service('events_update_time')
            update_time.REQUIRE_LOCK = False
            # mocking function
            is_original_event_func = update_time.is_original_event
            update_time.is_original_event = Mock(return_value=False)

            res = update_time.patch(events[0].get('_id'), {'dates': schedule, 'update_method': 'all'})
            self.assertEqual(res.get('dates').get('start'), schedule['start'])

            events = list(service.get(req=None, lookup=None))
            self.assertPlanningSchedule(events, 3)

            schedule = deepcopy(events[1].get('dates'))
            schedule['start'] = datetime(2099, 11, 21, 20, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)
            schedule['end'] = datetime(2099, 11, 21, 21, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)

            res = update_time.patch(events[0].get('_id'), {'dates': schedule, 'update_method': 'single'})
            self.assertEqual(res.get('dates').get('start'), schedule['start'])

            events = list(service.get(req=None, lookup=None))
            self.assertPlanningSchedule(events, 3)

            # reset mocked function
            update_time.is_original_event = is_original_event_func
            update_time.REQUIRE_LOCK = True

    def test_planning_schedule_update_repetitions(self):
        service = get_resource_service('events')
        event = {
            'name': 'Friday Club',
            'dates': {
                'start': datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                'end': datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                'tz': 'Australia/Sydney',
                'recurring_rule': {
                    'frequency': 'DAILY',
                    'interval': 1,
                    'count': 3,
                    'endRepeatMode': 'count'
                }
            }
        }

        service.post([event])
        events = list(service.get(req=None, lookup=None))
        self.assertPlanningSchedule(events, 3)

        schedule = deepcopy(events[0].get('dates'))
        schedule['recurring_rule']['count'] = 5

        update_repetitions = get_resource_service('events_update_repetitions')
        update_repetitions.REQUIRE_LOCK = False
        # mocking function
        is_original_event_func = update_repetitions.is_original_event
        update_repetitions.is_original_event = Mock(return_value=False)
        update_repetitions.patch(events[0].get('_id'), {'dates': schedule})

        events = list(service.get(req=None, lookup=None))
        self.assertPlanningSchedule(events, 5)

        # reset mocked function
        update_repetitions.is_original_event = is_original_event_func
        update_repetitions.REQUIRE_LOCK = True

    @patch('planning.events.events.get_user')
    def test_planning_schedule_convert_to_recurring(self, get_user_mock):
        service = get_resource_service('events')
        get_user_mock.return_value = {'_id': 'None'}
        event = {
            'name': 'Friday Club',
            'dates': {
                'start': datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                'end': datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                'tz': 'Australia/Sydney'
            }
        }

        service.post([event])
        events = list(service.get(req=None, lookup=None))
        self.assertPlanningSchedule(events, 1)
        lock_service = LockService(self.app)
        locked_event = lock_service.lock(events[0], None, 'session', 'convert_recurring', 'events')
        self.assertEqual(locked_event.get('lock_action'), 'convert_recurring')
        schedule = deepcopy(events[0].get('dates'))
        schedule['start'] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC)
        schedule['end'] = datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC)
        schedule['recurring_rule'] = {
            'frequency': 'DAILY',
            'interval': 1,
            'count': 3,
            'endRepeatMode': 'count'
        }

        service.patch(events[0].get('_id'), {
            '_id': events[0].get('_id'),
            'dates': schedule})
        events = list(service.get(req=None, lookup=None))
        self.assertPlanningSchedule(events, 3)


def generate_recurring_events(num_events):
    events = []
    days = -2
    now = utcnow()
    for i in range(num_events):
        start = now + timedelta(days=days)
        end = start + timedelta(hours=4)
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
