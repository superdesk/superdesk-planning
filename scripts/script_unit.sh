#!/bin/bash -e

PLANNING_DIR=`pwd`

cd $PLANNING_DIR/server
flake8
nosetests -v --with-coverage --cover-package=planning
mv .coverage $PLANNING_DIR/.coverage.nosetests
coverage run --source planning --omit "*tests*" -m behave --format progress2 --logging-level=ERROR
mv .coverage $PLANNING_DIR/.coverage.behave

cd $PLANNING_DIR
coverage combine .coverage.behave .coverage.nosetests

npm run test
