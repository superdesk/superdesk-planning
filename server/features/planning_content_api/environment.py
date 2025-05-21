import asyncio
import logging
from superdesk.tests.environment import setup_before_all, before_scenario_async
from content_api.app import get_app as _get_app
from settings import env
from content_api.app.settings import CONTENTAPI_INSTALLED_APPS, MODULES, URL_PREFIX, CONTENTAPI_URL, ASYNC_AUTH_CLASS

logger = logging.getLogger(__name__)


def get_app(*args, **kwargs):
    return _get_app(*args, **kwargs)


def before_all(context):
    MODULES.extend(["planning.content_api"])
    config = {
        "BEHAVE": True,
        "ELASTICSEARCH_FORCE_REFRESH": True,
        "CONTENTAPI_INSTALLED_APPS": CONTENTAPI_INSTALLED_APPS,
        "MODULES": MODULES,
        "CONTENTAPI_ENABLED": True,
        "URL_PREFIX": URL_PREFIX,
        "SERVER_URL": CONTENTAPI_URL,
        "ASYNC_AUTH_CLASS": ASYNC_AUTH_CLASS,
        "CONTENTAPI_URL": CONTENTAPI_URL,
        "CACHE_TYPE": "null",
    }

    LOG_CONFIG_FILE = env("LOG_CONFIG_FILE", "../e2e/server/logging_config.yml")
    if LOG_CONFIG_FILE:
        config["LOG_CONFIG_FILE"] = LOG_CONFIG_FILE

    current_app = get_app()

    context.app = current_app
    context.headers = []
    context.client = current_app.test_client()
    context._config_backup = config

    setup_before_all(context, config, app_factory=current_app)


def before_scenario(context, scenario):
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(before_scenario_async(context, scenario))
    except Exception as e:
        # Make sure exceptions raised are printed to the console
        logger.exception(e)
        raise e
