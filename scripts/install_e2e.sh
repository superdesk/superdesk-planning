#!/bin/bash -e

PLANNING_DIR=`pwd`

cd $PLANNING_DIR/e2e/server
pip install -r requirements.txt

sudo sed -i 's\enabled: true\enabled: false\' /etc/mongod.conf
sudo service mongod restart
sudo service elasticsearch restart

cd $PLANNING_DIR/e2e
npm install --python=python2.7
npm install -g grunt-cli
npm run build
