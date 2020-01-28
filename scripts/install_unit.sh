#!/bin/bash -e

PLANNING_DIR=`pwd`

sudo sed -i 's\enabled: true\enabled: false\' /etc/mongod.conf
sudo service mongod restart
sudo service elasticsearch restart

cd $PLANNING_DIR/server
pip install -r requirements.txt

cd $PLANNING_DIR
npm install
gem install coveralls-lcov
