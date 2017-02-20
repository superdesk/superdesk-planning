
from superdesk.tests import TestCase as _TestCase
from superdesk.factory.app import get_app


class TestCase(_TestCase):

    def setUp(self):
        config = {
            'INSTALLED_APPS': ['planning']
        }
        self.app = get_app(config)
        super().setUp()
