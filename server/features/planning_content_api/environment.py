import asyncio
import logging
from superdesk.tests.environment import setup_before_all
from content_api.app import get_app as _get_app
from settings import env
from content_api.app.settings import CONTENTAPI_INSTALLED_APPS, MODULES, URL_PREFIX
from superdesk.tests import setup as setup_app
from superdesk import tests

logger = logging.getLogger(__name__)


def get_app(*args, **kwargs):
    return _get_app(*args, **kwargs)


def before_all(context):
    MODULES.append("planning.content_api")
    config = {
        "BEHAVE": True,
        "ELASTICSEARCH_FORCE_REFRESH": True,
        "CONTENTAPI_INSTALLED_APPS": CONTENTAPI_INSTALLED_APPS,
        "MODULES": MODULES,
        "CONTENTAPI_ENABLED": True,
        "URL_PREFIX": URL_PREFIX,
    }

    LOG_CONFIG_FILE = env("LOG_CONFIG_FILE", "../e2e/server/logging_config.yml")
    if LOG_CONFIG_FILE:
        config["LOG_CONFIG_FILE"] = LOG_CONFIG_FILE

    context.app = get_app().async_app
    setup_before_all(context, config, app_factory=get_app)


def run_async_task(task):
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(task)
    except Exception as e:
        logger.exception(e)
        raise e


async def before_scenario_async(context, scenario):
    MODULES.append("planning.content_api")
    config = {
        "BEHAVE": True,
        "ELASTICSEARCH_FORCE_REFRESH": True,
        "CONTENTAPI_INSTALLED_APPS": CONTENTAPI_INSTALLED_APPS,
        "MODULES": MODULES,
        "CONTENTAPI_ENABLED": True,
        "URL_PREFIX": URL_PREFIX,
    }

    context.app = get_app(config=config).async_app
    await setup_app(context, config, app_factory=get_app, reset=True)
    await setup_before_all(context, scenario, config, app_factory=get_app)
