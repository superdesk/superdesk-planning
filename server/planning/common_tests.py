from planning.tests import TestCase
from .common import set_actioned_date_to_event, get_coverage_status_from_cv
from datetime import datetime, timedelta
from superdesk.utc import utcnow


class CommonTestCase(TestCase):
    def test_actioned_day(self):
        # Test to ensure if the multi-day event spans current day,
        # Then, current date should be the actioned date
        now = utcnow()
        updates = {}
        original = {
            "dates": {
                "start": now - timedelta(days=3),
                "end": now + timedelta(days=3),
            }
        }
        set_actioned_date_to_event(updates, original)
        self.assertEqual(updates.get("actioned_date").date(), now.date())

        # Test to ensure if the multi-day event is entirely in past,
        # Then, current date should be event start date
        updates = {}
        start = now - timedelta(days=3)
        original = {
            "dates": {
                "start": start,
                "end": now - timedelta(days=2),
            }
        }
        set_actioned_date_to_event(updates, original)
        self.assertEqual(updates.get("actioned_date").date(), start.date())

        # Test to ensure nothing happens if event is not multi-day
        updates = {}
        original = {
            "dates": {
                "start": datetime(2029, 9, 30),
                "end": datetime(2029, 9, 30, 23, 59),
            }
        }
        set_actioned_date_to_event(updates, original)
        self.assertEqual(updates, {})

    def test_get_coverage_status_from_cv(self):
        with self.app.app_context():
            items = [
                {
                    "is_active": True,
                    "qcode": "ncostat:int",
                    "name": "coverage intended",
                    "label": "Coverage planned",
                },
                {
                    "is_active": True,
                    "qcode": "ncostat:notdec",
                    "name": "coverage not decided yet",
                    "label": "Coverage on merit",
                },
                {
                    "is_active": False,
                    "qcode": "ncostat:notint",
                    "name": "coverage not intended",
                    "label": "Coverage not planned",
                },
                {
                    "is_active": True,
                    "qcode": "ncostat:onreq",
                    "name": "coverage upon request",
                    "label": "Coverage on request",
                },
            ]
            self.app.data.insert(
                "vocabularies",
                [
                    {
                        "_id": "newscoveragestatus",
                        "display_name": "News Coverage Status",
                        "type": "manageable",
                        "unique_field": "qcode",
                        "selection_type": "do not show",
                        "items": items,
                    }
                ],
            )

            self.assertEqual(get_coverage_status_from_cv("ncostat:int")["label"], "Coverage planned")
            self.assertEqual(get_coverage_status_from_cv("ncostat:notdec")["label"], "Coverage on merit")
            self.assertEqual(get_coverage_status_from_cv("ncostat:notint")["label"], "Coverage not planned")
            self.assertEqual(get_coverage_status_from_cv("ncostat:onreq")["label"], "Coverage on request")

    def test_get_coverage_status_from_cv_without_cv(self):
        with self.app.app_context():
            self.assertEqual(get_coverage_status_from_cv("ncostat:int")["label"], "Planned")
            self.assertEqual(get_coverage_status_from_cv("ncostat:notdec")["label"], "On merit")
            self.assertEqual(get_coverage_status_from_cv("ncostat:notint")["label"], "Not planned")
            self.assertEqual(get_coverage_status_from_cv("ncostat:onreq")["label"], "On request")
