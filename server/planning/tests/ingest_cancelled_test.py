from flask import request
from planning.tests import TestCase
from planning.common import update_post_item


class IngestCancelledTestCase(TestCase):
    def test_ingest_cancelled_event(self):
        assert not request, request

        assignments = [
            {"planning_item": "p1", "coverage_item": "c1"},
        ]

        self.app.data.insert("assignments", assignments)
        planning = {
            "_id": "p1",
            "name": "planning item",
            "type": "planning",
            "coverages": [
                {
                    "coverage_id": "c1",
                    "planning": {},
                    "assigned_to": {
                        "assignment_id": assignments[0]["_id"],
                    },
                },
            ],
        }

        self.app.data.insert("planning", [planning])

        with self.app.app_context():
            update_post_item({"pubstatus": "cancelled"}, planning)

        cursor, count = self.app.data.find("assignments", req=None, lookup={})
        assert count == 0
