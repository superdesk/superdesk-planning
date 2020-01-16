from os import environ, path
import settings
import logging

from superdesk.factory import get_app as superdesk_app
from superdesk.logging import configure_logging

logger = logging.getLogger(__name__)


def get_app(config=None):
    if config is None:
        config = {}

    config['APP_ABSPATH'] = path.abspath(path.dirname(__file__))
    for key in dir(settings):
        if key.isupper():
            config.setdefault(key, getattr(settings, key))

    config['DOMAIN'] = {}

    app = superdesk_app(config)
    configure_logging(config['LOG_CONFIG_FILE'])
    return app


if __name__ == '__main__':
    debug = True
    host = '0.0.0.0'
    port = int(environ.get('PORT', '5000'))
    app = get_app()
    app.run(host=host, port=port, debug=debug, use_reloader=debug)
