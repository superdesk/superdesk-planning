from superdesk.tests import utils as test_utils
from superdesk.tests.fixtures.users import ADMIN_USER_ID
from superdesk.tests.fixtures.desks import SPORTS_DESK_ID

PLAN1_ID = "plan1"
PLAN1_TEXT_COVERAGE_1_ID = "cov1"


def plan1() -> dict:
    return {
        "guid": "plan1",
        "planning_date": "2032-07-03T14:00:00+0000",
        "coverages": [
            {
                "coverage_id": PLAN1_TEXT_COVERAGE_1_ID,
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text",
                    "slugline": "test text 1",
                    "scheduled": "2032-07-03T16:00:00+0000",
                },
                "assigned_to": {"desk": SPORTS_DESK_ID, "user": ADMIN_USER_ID, "state": "assigned"},
            }
        ],
    }


async def get_plan1_assignment() -> dict:
    return await test_utils.find_one("assignments", planning_item=PLAN1_ID, coverage_item=PLAN1_TEXT_COVERAGE_1_ID)


def all_plans() -> list[dict]:
    return [plan1()]
