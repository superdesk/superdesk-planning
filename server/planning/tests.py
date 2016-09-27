import unittest
from planning import init_app


class PlanningTestCase(unittest.TestCase):
    def test_init_app_exist(self):
        self.assertIsNotNone(init_app)


if __name__ == '__main__':
    unittest.main()
