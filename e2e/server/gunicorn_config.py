import os

bind = '0.0.0.0:5000'
workers = 3

loglevel = 'info'

reload = 'SUPERDESK_RELOAD' in os.environ
timeout = int(os.environ.get('WEB_TIMEOUT', 500))
