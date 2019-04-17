from planning.tests import TestCase
from .common import set_actioned_date_to_event
from datetime import datetime, timedelta
from superdesk.utc import utcnow


class CommonTestCase(TestCase):

    def test_actioned_day(self):
        # Test to ensure if the multi-day event spans current day,
        # Then, current date should be the actioned date
        now = utcnow()
        updates = {}
        original = {
            'dates': {
                'start': now - timedelta(days=3),
                'end': now + timedelta(days=3),
            }
        }
        set_actioned_date_to_event(updates, original)
        self.assertEqual(updates.get('actioned_date').date(), now.date())

        # Test to ensure if the multi-day event is entirely in past,
        # Then, current date should be event start date
        updates = {}
        start = now - timedelta(days=3)
        original = {
            'dates': {
                'start': start,
                'end': now - timedelta(days=2),
            }
        }
        set_actioned_date_to_event(updates, original)
        self.assertEqual(updates.get('actioned_date').date(), start.date())

        # Test to ensure nothing happens if event is not multi-day
        updates = {}
        original = {
            'dates': {
                'start': datetime(2029, 9, 30),
                'end': datetime(2029, 9, 30, 23, 59),
            }
        }
        set_actioned_date_to_event(updates, original)
        self.assertEqual(updates, {})
