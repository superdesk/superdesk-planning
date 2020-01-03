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

init_data = Path(ABS_PATH) / 'data'
if init_data.exists():
    INIT_DATA_PATH = init_data

INSTALLED_APPS.extend([
    'planning',
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










# import os
# import json
# from superdesk.default_settings import strtobool
#
# try:
#     from urllib.parse import urlparse
# except ImportError:
#     from urlparse import urlparse
#
#
# def env(variable, fallback_value=None):
#     env_value = os.environ.get(variable, '')
#     if len(env_value) == 0:
#         return fallback_value
#     else:
#         if env_value == "__EMPTY__":
#             return ''
#         else:
#             return env_value
#
# ABS_PATH = os.path.abspath(os.path.dirname(__file__))
# INIT_DATA_PATH = os.path.join(ABS_PATH, 'data')
#
# LOG_CONFIG_FILE = env('LOG_CONFIG_FILE', 'logging_config.yml')
#
# APPLICATION_NAME = env('APP_NAME', 'Superdesk')
# DEFAULT_TIMEZONE = env('DEFAULT_TIMEZONE', 'Australia/Sydney')
#
# DEBUG = False
# SUPERDESK_TESTING = True
#
# SERVER_NAME = 'localhost:5000'
# URL_PROTOCOL = 'http'
# URL_PREFIX = 'api'
#
# WS_HOST = '0.0.0.0'
# WS_PORT = '5000'
#
# # WS_HOST = env('WSHOST', '0.0.0.0')
# # WS_PORT = env('WSPORT', '5100')
#
# CLIENT_URL = 'http://localhost:9000'
# SUPERDESK_URL = 'http://192.168.233.128:5000/api'
# SUPERDESK_WS_URL = 'ws://192.168.233.128:5100'
# # server_url = urlparse(env('SUPERDESK_URL', 'http://localhost:5000/api'))
# server_url = urlparse('http://localhost:5000/api')
#
# REDIS_URL = 'redis://localhost:6379/2'
# BROKER_URL = env('CELERY_BROKER_URL', REDIS_URL)
#
# MONGO_DBNAME = 'superdesk_e2e'
# MONGO_URI = 'mongodb://localhost/%s' % MONGO_DBNAME
#
# ARCHIVED_DBNAME = 'superdesk_e2e_archived'
# ARCHIVED_URI = 'mongodb://localhost/%s' % ARCHIVED_DBNAME
#
# LEGAL_ARCHIVE_DBNAME = 'superdesk_e2e_legal_archive'
# LEGAL_ARCHIVE_URI = 'mongodb://localhost/%s' % LEGAL_ARCHIVE_DBNAME
#
# CONTENTAPI_MONGO_DBNAME = 'contentapi_e2e'
# CONTENTAPI_MONGO_URI = 'mongodb://localhost/%s' % CONTENTAPI_MONGO_DBNAME
#
# ELASTICSEARCH_INDEXES = {
#     'archived': 'superdesk_e2e_archived',
#     'archive': 'superdesk_e2e_archive',
#     'ingest': 'superdesk_e2e_ingest',
#     'published': 'superdesk_e2e_published',
#     'planning': 'superdesk_e2e_planning',
#     'events': 'superdesk_e2e_events',
#     'locations': 'superdesk_e2e_locations',
#     'contacts': 'superdesk_e2e_contacts',
#     'assignments': 'superdesk_e2e_assignments'
# }
#
# ELASTICSEARCH_INDEX = MONGO_DBNAME
# ELASTICSEARCH_BACKUPS_PATH = '/tmp/es-backups/'
#
# CONTENTAPI_ELASTICSEARCH_INDEX = CONTENTAPI_MONGO_DBNAME
#
# LEGAL_ARCHIVE = True
#
# CELERY_TASK_ALWAYS_EAGER = True
#
# INSTALLED_APPS = [
#     'apps.auth',
#     'superdesk.roles',
#     'superdesk.users',
#     'apps.auth.db',
#     'superdesk.upload',
#     'superdesk.download',
#     'superdesk.sequences',
#     'superdesk.notification',
#     'superdesk.data_updates',
#     'superdesk.activity',
#     'superdesk.vocabularies',
#     'superdesk.backend_meta',
#     'apps.comments',
#
#     'superdesk.io',
#     'superdesk.io.feeding_services',
#     'superdesk.io.feed_parsers',
#     'superdesk.io.subjectcodes',
#     'superdesk.io.iptc',
#     'apps.io',
#     'apps.io.feeding_services',
#     'superdesk.publish',
#     'superdesk.commands',
#     'superdesk.locators',
#
#     'apps.auth',
#     'apps.archive',
#     'apps.stages',
#     'apps.desks',
#     'apps.tasks',
#     'apps.preferences',
#     'apps.spikes',
#     'apps.prepopulate',
#     'apps.legal_archive',
#     'apps.search',
#     'apps.saved_searches',
#     'apps.privilege',
#     'apps.rules',
#     'apps.highlights',
#     'apps.products',
#     'apps.publish',
#     'apps.publish.enqueue',
#     'apps.publish.formatters',
#     'apps.content_filters',
#     'apps.content_types',
#     'apps.dictionaries',
#     'apps.duplication',
#     'apps.spellcheck',
#     'apps.templates',
#     'apps.archived',
#     'apps.validators',
#     'apps.validate',
#     'apps.workspace',
#     'apps.macros',
#     'apps.export',
#     'apps.archive_broadcast',
#     'apps.search_providers',
#     'apps.feature_preview',
#     'apps.workqueue',
#     'planning',
# ]
