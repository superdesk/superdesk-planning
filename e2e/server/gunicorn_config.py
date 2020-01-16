import os
import multiprocessing

bind = '0.0.0.0:5000'
workers = int(os.environ.get('WEB_CONCURRENCY', multiprocessing.cpu_count() * 2 + 1))

accesslog = '-'
access_log_format = '%(m)s %(U)s status=%(s)s time=%(T)ss size=%(B)sb'
loglevel = 'debug'

reload = 'SUPERDESK_RELOAD' in os.environ
timeout = int(os.environ.get('WEB_TIMEOUT', 500))
