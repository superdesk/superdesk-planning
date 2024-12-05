from typing import Any
from superdesk.tests import TestCase as BaseTestCase


class TestCase(BaseTestCase):
    test_context = None  # avoid using test_request_context
    app_config: dict[str, Any] = {
        "INSTALLED_APPS": ["planning"],
        "MODULES": ["planning.module"],
    }
