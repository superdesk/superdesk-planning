#!/bin/bash
set -e

cd /opt/superdesk/e2e/server

# wait for elastic to be up
printf 'waiting for elastic.'
until $(curl --output /dev/null --silent --head --fail "${ELASTICSEARCH_URL}"); do
    printf '.'
    sleep .5
done
echo 'done.'

# init dbs
QUART_APP=app:get_app honcho run python3 manage.py app:initialize_data

exec "$@"
