import os
from pathlib import Path
from superdesk.default_settings import INSTALLED_APPS, SECRET_KEY, env

ABS_PATH = str(Path(__file__).resolve().parent)

DEBUG = False
SUPERDESK_TESTING = True

DEFAULT_TIMEZONE = env('DEFAULT_TIMEZONE', 'Australia/Sydney')

init_data = Path(ABS_PATH) / 'data'
if init_data.exists():
    INIT_DATA_PATH = init_data

INSTALLED_APPS.extend([
    'planning',
    'planning_prepopulate',
    'force_unlock_item',
])


WS_HOST = env('WSHOST', '0.0.0.0')
WS_PORT = env('WSPORT', '5100')

LOG_CONFIG_FILE = env('LOG_CONFIG_FILE', 'logging_config.yml')

REDIS_URL = env('REDIS_URL', 'redis://localhost:6379')
BROKER_URL = env('CELERY_BROKER_URL', REDIS_URL)

MONGO_DBNAME = 'e2e_superdesk'
MONGO_URI = os.environ.get("MONGO_URI", 'mongodb://localhost/%s' % MONGO_DBNAME)

ARCHIVED_DBNAME = 'e2e_archived'
ARCHIVED_URI = os.environ.get("ARCHIVED_MONGO_URI", 'mongodb://localhost/%s' % ARCHIVED_DBNAME)

LEGAL_ARCHIVE = False
CONTENTAPI_ENABLED = False

PLANNING_EVENT_TEMPLATES_ENABLED = True
