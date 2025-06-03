from typing import Any

from bson import ObjectId

from superdesk.core import AsyncSignal
from superdesk.flask import g
from superdesk.tests import TestCase as BaseTestCase
from superdesk.default_settings import MODULES

from planning import signals as planning_signals


class TestCase(BaseTestCase):
    test_context = None  # avoid using test_request_context

    app_config: dict[str, Any] = {
        "INSTALLED_APPS": ["planning"],
        "MODULES": MODULES + ["planning.module"],
    }

    async def asyncSetUp(self):
        await super().asyncSetUp()
        clear_planning_signal_listeners()

    def setup_test_user(self):
        user = {"_id": ObjectId()}
        self.app.data.insert("users", [user])
        g.user = user


def clear_planning_signal_listeners() -> None:
    signal_instances = [
        getattr(planning_signals, attr_name)
        for attr_name in dir(planning_signals)
        if isinstance(getattr(planning_signals, attr_name), AsyncSignal)
    ]
    for signal_instance in signal_instances:
        signal_instance.clear_listeners()
