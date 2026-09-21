from superdesk.tests import update_config, TestClient
from superdesk.tests.environment import (
    setup_before_all,
    before_scenario_async as setup_before_scenario,
    before_all,
    before_feature_async,
    after_scenario,
    before_step,
)
from content_api.app import get_app
from quart_babel import Babel

from features.utils import run_async_task
from features.environment import populate_cvs


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


def before_scenario(context, scenario):
    run_async_task(before_scenario_async(context, scenario))


async def before_scenario_async(context, scenario):
    await setup_before_scenario(context, scenario)
    await populate_cvs(context)
