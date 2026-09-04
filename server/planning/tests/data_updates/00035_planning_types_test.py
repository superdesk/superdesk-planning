import importlib

from superdesk.commands.data_updates import get_db_and_collection
from superdesk.tests import utils

from planning.tests import TestCase

DataUpdate = importlib.import_module("planning.data_updates.00035_20250529-105000_planning_types").DataUpdate


class UpgradeTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()

    async def test_upgrade(self):
        async with self.app.app_context():
            await utils.post_items(
                "planning_types",
                [
                    {
                        "name": "event",
                        "type": "event",
                        "schema": {"custom_vocabularies": {"vocabularies": ["v1", "v2"], "mandatory_in_list": ["v1"]}},
                        "editor": {
                            "other": {"enabled": True, "group": "group2", "index": 0},
                            "before": {"enabled": True, "group": "group1", "index": 0},
                            "custom_vocabularies": {"enabled": True, "group": "group1", "index": 1},
                            "after": {"enabled": True, "group": "group1", "index": 2},
                        },
                    },
                ],
            )

            collection, db = get_db_and_collection(DataUpdate.resource, True)
            await DataUpdate().forwards(collection, db)

        profile = await utils.find_one("planning_types", type="event")
        assert profile is not None
        assert profile["schema"]["v1"] == {"type": "custom_vocabulary", "required": True}
        assert profile["schema"]["v2"] == {"type": "custom_vocabulary", "required": False}
        assert "custom_vocabularies" not in profile["schema"]

        assert profile["editor"]["before"] == {"enabled": True, "group": "group1", "index": 0}
        assert profile["editor"]["v1"] == {"enabled": True, "group": "group1", "index": 1}
        assert profile["editor"]["v2"] == {"enabled": True, "group": "group1", "index": 2}
        assert profile["editor"]["after"] == {"enabled": True, "group": "group1", "index": 3}
        assert "custom_vocabularies" not in profile["editor"]
