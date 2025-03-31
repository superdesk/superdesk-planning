import os

bind = "0.0.0.0:%s" % os.environ.get("PORT", "5000")
workers = 3

accesslog = "-"
access_log_format = "%(m)s %(U)s status=%(s)s time=%(T)ss size=%(B)sb"

loglevel = "warning"

use_reload = "SUPERDESK_RELOAD" in os.environ
timeout = int(os.environ.get("WEB_TIMEOUT", 500))
