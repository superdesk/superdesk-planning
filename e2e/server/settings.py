import os
from pathlib import Path
from superdesk.default_settings import INSTALLED_APPS


def env(variable, fallback_value=None):
    env_value = os.environ.get(variable, '')
    if len(env_value) == 0:
        return fallback_value
    else:
        if env_value == "__EMPTY__":
            return ''
        else:
            return env_value


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
])

RENDITIONS = {
    'picture': {
        'thumbnail': {'width': 220, 'height': 120},
        'viewImage': {'width': 640, 'height': 640},
        'baseImage': {'width': 1400, 'height': 1400},
    },
    'avatar': {
        'thumbnail': {'width': 60, 'height': 60},
        'viewImage': {'width': 200, 'height': 200},
    }
}

WS_HOST = env('WSHOST', '0.0.0.0')
WS_PORT = env('WSPORT', '5100')

LOG_CONFIG_FILE = env('LOG_CONFIG_FILE', 'logging_config.yml')

REDIS_URL = env('REDIS_URL', 'redis://localhost:6379')
if env('REDIS_PORT'):
    REDIS_URL = env('REDIS_PORT').replace('tcp:', 'redis:')
BROKER_URL = env('CELERY_BROKER_URL', REDIS_URL)

SECRET_KEY = env('SECRET_KEY', '')

MONGO_DBNAME = 'e2e_superdesk'
MONGO_URI = 'mongodb://localhost/%s' % MONGO_DBNAME

ARCHIVED_DBNAME = 'e2e_archived'
ARCHIVED_URI = 'mongodb://localhost/%s' % ARCHIVED_DBNAME

LEGAL_ARCHIVE = False
CONTENTAPI_ENABLED = False

PLANNING_EVENT_TEMPLATES_ENABLED = True
