from typing import Any

from bson import ObjectId
from superdesk.flask import g
from superdesk.tests import TestCase as BaseTestCase


class TestCase(BaseTestCase):
    test_context = None  # avoid using test_request_context

    app_config: dict[str, Any] = {
        "INSTALLED_APPS": ["planning"],
        "MODULES": ["planning.module"],
    }

    def setup_test_user(self):
        user = {"_id": ObjectId()}
        self.app.data.insert("users", [user])
        g.user = user
