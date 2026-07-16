from superdesk.tests import update_config, TestClient
from features.utils import run_async_task
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
from quart_babel import Babel


def before_feature(context, feature):
    run_async_task(setup_apps(context, feature))


async def setup_apps(context, feature):
    config = update_config({}, auto_add_apps=False)
    context.capi = get_app(config)

    # TODO: Move this to the CAPI and PAPI apps
    Babel(context.capi, configure_jinja=False)

    context.capi.test_client_class = TestClient
    context.capi_client = context.capi.test_client()
    await before_feature_async(context, feature)
