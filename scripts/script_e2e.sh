#!/bin/bash -e

export TZ=Australia/Sydney
PLANNING_DIR=`pwd`

cd $PLANNING_DIR/e2e/server
honcho start &

cd $PLANNING_DIR/e2e
npm run cypress-ci
