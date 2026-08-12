from flask import request

from superdesk.tests import utils as test_utils, fixtures
from superdesk.flask import g

from planning.tests import TestCase, fixtures as planning_fixtures
from planning.common import update_post_item


class IngestCancelledTestCase(TestCase):
    async def test_ingest_cancelled_event(self):
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await planning_fixtures.publish_config.configure_planning_publishing()
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

        await self.app.data.insert_async("planning", [planning])

        await update_post_item({"pubstatus": "cancelled"}, planning)

        cursor, count = self.app.data.find("assignments", req=None, lookup={})
        assert count == 0
