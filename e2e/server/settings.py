import os
from pathlib import Path
from superdesk.default_settings import INSTALLED_APPS

try:
    from urllib.parse import urlparse
except ImportError:
    from urlparse import urlparse


def env(variable, fallback_value=None):
    env_value = os.environ.get(variable, '')
    if len(env_value) == 0:
        return fallback_value
    else:
        if env_value == "__EMPTY__":
            return ''
        else:
            return env_value


CLIENT_URL = env('SUPERDESK_CLIENT_URL', 'http://localhost:9000')
SERVER_URL = env('SUPERDESK_URL', 'http://localhost:5000/api')
server_url = urlparse(SERVER_URL)
SERVER_DOMAIN = server_url.netloc or 'localhost'
URL_PREFIX = env('URL_PREFIX', server_url.path.lstrip('/')) or ''

#: mongo db name, only used when mongo_uri is not set
MONGO_DBNAME = env('MONGO_DBNAME', 'superdesk')

#: full mongodb connection uri, overrides ``MONGO_DBNAME`` if set
MONGO_URI = env('MONGO_URI', 'mongodb://superdesk/%s' % MONGO_DBNAME)

#: allow all mongo queries
MONGO_QUERY_BLACKLIST = []

#: legal archive switch
LEGAL_ARCHIVE = env('LEGAL_ARCHIVE', None)

#: legal archive db name
LEGAL_ARCHIVE_DBNAME = env('LEGAL_ARCHIVE_DBNAME', 'legal_archive')

#: legal archive mongodb uri
LEGAL_ARCHIVE_URI = env('LEGAL_ARCHIVE_URI', 'mongodb://superdesk/%s' % LEGAL_ARCHIVE_DBNAME)

#: archived mongodb db name
ARCHIVED_DBNAME = env('ARCHIVED_DBNAME', 'archived')

#: archived mongodb uri
ARCHIVED_URI = env('ARCHIVED_URI', 'mongodb://superdesk/%s' % ARCHIVED_DBNAME)

CONTENTAPI_MONGO_DBNAME = 'contentapi'
CONTENTAPI_MONGO_URI = env('CONTENTAPI_MONGO_URI', 'mongodb://superdesk/%s' % CONTENTAPI_MONGO_DBNAME)

#: elastic url
ELASTICSEARCH_URL = env('ELASTICSEARCH_URL', 'http://superdesk:9200')
CONTENTAPI_ELASTICSEARCH_URL = env('CONTENTAPI_ELASTICSEARCH_URL', ELASTICSEARCH_URL)

#: elastic index name
ELASTICSEARCH_INDEX = env('ELASTICSEARCH_INDEX', 'superdesk')
CONTENTAPI_ELASTICSEARCH_INDEX = env('CONTENTAPI_ELASTICSEARCH_INDEX', CONTENTAPI_MONGO_DBNAME)

if env('ELASTIC_PORT'):
    ELASTICSEARCH_URL = env('ELASTIC_PORT').replace('tcp:', 'http:')

#: redis url
REDIS_URL = env('REDIS_URL', 'redis://superdesk:6379')
if env('REDIS_PORT'):
    REDIS_URL = env('REDIS_PORT').replace('tcp:', 'redis:')

#: cache url - superdesk will try to figure out if it's redis or memcached
CACHE_URL = env('SUPERDESK_CACHE_URL', REDIS_URL)

#: celery broker
BROKER_URL = env('CELERY_BROKER_URL', REDIS_URL)
CELERY_BROKER_URL = BROKER_URL

WS_HOST = env('WSHOST', '0.0.0.0')
WS_PORT = env('WSPORT', '5100')


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

# REDIS_URL = env('REDIS_URL', 'redis://localhost:6379')
# if env('REDIS_PORT'):
#     REDIS_URL = env('REDIS_PORT').replace('tcp:', 'redis:')
# BROKER_URL = env('CELERY_BROKER_URL', REDIS_URL)
#
# SECRET_KEY = env('SECRET_KEY', '')
#
# MONGO_DBNAME = 'e2e_superdesk'
# MONGO_URI = 'mongodb://localhost/%s' % MONGO_DBNAME
#
# ARCHIVED_DBNAME = 'e2e_archived'
# ARCHIVED_URI = 'mongodb://localhost/%s' % ARCHIVED_DBNAME

LEGAL_ARCHIVE = False
CONTENTAPI_ENABLED = False

PLANNING_EVENT_TEMPLATES_ENABLED = True

