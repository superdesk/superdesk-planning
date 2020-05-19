import os
import multiprocessing

bind = '0.0.0.0:5000'
workers = int(os.environ.get('WEB_CONCURRENCY', multiprocessing.cpu_count() * 2 + 1))

loglevel = 'warning'

reload = 'SUPERDESK_RELOAD' in os.environ
timeout = int(os.environ.get('WEB_TIMEOUT', 500))
