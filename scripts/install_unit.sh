#!/bin/bash -e

npm install
cd server && pip install -r requirements.txt && cd ..
gem install coveralls-lcov
