#!/bin/bash -e
BACKEND_DIR=server
VENV=`pwd`/$BACKEND_DIR/env/bin/activate
PLANNING_DIR=`pwd`

npm install superdesk/superdesk-client-core#develop
npm install
cd server && pip install -r requirements.txt && cd ..
gem install coveralls-lcov

cd $BACKEND_DIR
flake8
nosetests -v --with-coverage --cover-package=planning
mv .coverage ../.coverage.nosetests
coverage run --source planning --omit "*tests*" -m behave --format progress2 --logging-level=ERROR
mv .coverage ../.coverage.behave
cd ..
coverage combine .coverage.behave .coverage.nosetests

npm run test
