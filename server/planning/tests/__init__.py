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

    async def setUp(self):
        """
        Set up the test case by entering the application's asynchronous context.
        This ensures all tests run within the same app context, avoiding repetitive
        boilerplate and allowing automatic resource cleanup, even if a test fails.

        Using `enterAsyncContext` ensures the app context (`self.app.app_context()`)
        is properly exited after each test.
        """

        self.ctx = await self.enterAsyncContext(self.app.app_context())
