import logging
import asyncio

from superdesk.tests import update_config, TestClient
from superdesk.tests.environment import (
    setup_before_all,
    before_scenario_async,
    before_all,
    # before_feature,
    before_feature_async,
    before_scenario,
    after_scenario,
    before_step,
)
from content_api.app import get_app
from content_api.app.settings import MODULES


logger = logging.getLogger(__name__)


def before_feature(context, feature):
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(setup_apps(context, feature))
    except Exception as e:
        # Make sure exceptions raised are printed to the console
        logger.exception(e)
        raise e


async def setup_apps(context, feature):
    config = update_config({"MODULES": MODULES + ["planning.content_api"]}, auto_add_apps=False)
    context.capi = get_app(config)
    context.capi.test_client_class = TestClient
    context.capi_client = context.capi.test_client()
    await before_feature_async(context, feature)
