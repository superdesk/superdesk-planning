import asyncio
import logging


logger = logging.getLogger(__name__)


def run_async_task(task):
    """
    Runs async task until completes and logs any exceptions.
    """
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(task)
    except Exception as e:
        logger.exception(e)
        raise e
