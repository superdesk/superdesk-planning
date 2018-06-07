
from superdesk.tests import TestCase as _TestCase, update_config, setup
from superdesk.factory.app import get_app


class TestCase(_TestCase):

    def setUp(self):
        config = {
            'INSTALLED_APPS': ['planning']
        }
        update_config(config)
        self.app = get_app(config)
        setup.app = self.app
        super().setUp()
