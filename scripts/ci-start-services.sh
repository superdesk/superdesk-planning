#!/usr/bin/env bash

if [ "$RUN_SERVICES" == "true" ]; then
    docker-compose -f .travis-docker-compose.yml up -d
    while ! curl -sfo /dev/null 'http://localhost:9200/'; do echo -n '.' && sleep .5; done
fi

if [ "$E2E" == "true" ]; then
    cd e2e/server
    honcho start &
    cd ../../
fi
