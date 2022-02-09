from planning.tests import TestCase
from planning.planning_article_export import get_items


class PlanningArticleExportTest(TestCase):
    planning_items = [{
        "_id": "plan1",
        "planning_date": "2016-01-02T14:00:00+0000",
        "type": "planning",
    }, {
        "_id": "plan2",
        "planning_date": "2016-01-03T14:00:00+0000",
        "type": "planning",
    }, {
        "_id": "plan3",
        "planning_date": "2016-01-04T14:00:00+0000",
        "type": "planning",
    }]

    event_items = [{
        "_id": "event1",
        "dates": {
            "start": "2016-01-02T14:00:00+0000",
            "end": "2016-01-03T14:00:00+0000",
        },
        "type": "event"
    }, {
        "_id": "event2",
        "dates": {
            "start": "2016-01-04T14:00:00+0000",
            "end": "2016-01-05T14:00:00+0000",
        },
        "type": "event"
    }, {
        "_id": "event3",
        "dates": {
            "start": "2016-01-06T14:00:00+0000",
            "end": "2016-01-07T14:00:00+0000",
        },
        "type": "event"
    }]

    def test_get_items_in_supplied_order(self):
        with self.app.app_context():
            self.app.data.insert("planning", self.planning_items)
            self.app.data.insert("events", self.event_items)

            items = get_items(["plan1", "plan2", "plan3"], "planning")
            assert items[0]["_id"] == "plan1"
            assert items[1]["_id"] == "plan2"
            assert items[2]["_id"] == "plan3"

            items = get_items(["plan3", "plan2", "plan1"], "planning")
            assert items[0]["_id"] == "plan3"
            assert items[1]["_id"] == "plan2"
            assert items[2]["_id"] == "plan1"

            items = get_items(["plan2", "plan1", "plan3"], "planning")
            assert items[0]["_id"] == "plan2"
            assert items[1]["_id"] == "plan1"
            assert items[2]["_id"] == "plan3"

            items = get_items(["event1", "event2", "event3"], "event")
            assert items[0]["_id"] == "event1"
            assert items[1]["_id"] == "event2"
            assert items[2]["_id"] == "event3"

            items = get_items(["event3", "event2", "event1"], "event")
            assert items[0]["_id"] == "event3"
            assert items[1]["_id"] == "event2"
            assert items[2]["_id"] == "event1"

            items = get_items(["event2", "event1", "event3"], "event")
            assert items[0]["_id"] == "event2"
            assert items[1]["_id"] == "event1"
            assert items[2]["_id"] == "event3"
