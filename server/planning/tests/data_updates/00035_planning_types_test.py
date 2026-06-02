import importlib

from planning.tests import TestCase

DataUpdate = importlib.import_module("planning.data_updates.00035_20250529-105000_planning_types").DataUpdate


class UpgradeTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()

    async def test_upgrade(self):
        async with self.app.app_context():
            self.app.data.insert(
                "planning_types",
                [
                    {
                        "name": "events",
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

            DataUpdate().forwards(self.app.data.get_mongo_collection(DataUpdate.resource), self.app.data.driver.db)

        profile = self.app.data.find_one("planning_types", req=None, name="events")
        assert profile is not None
        assert profile["schema"]["v1"] == {"type": "custom_vocabulary", "required": True}
        assert profile["schema"]["v2"] == {"type": "custom_vocabulary", "required": False}
        assert "custom_vocabularies" not in profile["schema"]

        assert profile["editor"]["before"] == {"enabled": True, "group": "group1", "index": 0}
        assert profile["editor"]["v1"] == {"enabled": True, "group": "group1", "index": 1}
        assert profile["editor"]["v2"] == {"enabled": True, "group": "group1", "index": 2}
        assert profile["editor"]["after"] == {"enabled": True, "group": "group1", "index": 3}
        assert "custom_vocabularies" not in profile["editor"]
