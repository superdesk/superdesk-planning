#!/bin/bash -e

cd server
flake8
nosetests -v --with-coverage --cover-package=planning
mv .coverage ../.coverage.nosetests
coverage run --source planning --omit "*tests*" -m behave --format progress2 --logging-level=ERROR
mv .coverage ../.coverage.behave
cd ..
coverage combine .coverage.behave .coverage.nosetests

npm run test
