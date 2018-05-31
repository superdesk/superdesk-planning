#!/bin/bash -e
BACKEND_DIR=server
VENV=`pwd`/$BACKEND_DIR/env/bin/activate
PLANNING_DIR=`pwd`

# clone all repos at same directory level as 'planning'
cd ..
git clone https://github.com/superdesk/superdesk-client-core.git
git clone https://github.com/superdesk/superdesk.git

cd superdesk
git checkout planning-mvp
npm install --python=python2.7
npm install -g grunt-cli
export CHROME_BIN=`which google-chrome` && $CHROME_BIN --version ;
cd server && pip install -r requirements.txt && cd ..
cd client && npm install

# npm links
cd $PLANNING_DIR
pip install -e .
npm link && cd ../superdesk-client-core && npm link && cd ..
cd superdesk/client
npm link superdesk-core && npm link superdesk-planning
# Build budle.js file
grunt build

pwd
ls -la
ls -la $PLANNING_DIR
sudo sed -i 's\enabled: true\enabled: false\' /etc/mongod.conf
sudo service mongod restart
#mkdir /tmp/es-backups
#sudo chown elasticsearch:elasticsearch /tmp/es-backups
#echo "path.repo: ['/tmp/es-backups']" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
#echo "index.store.type: memory" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
sudo service elasticsearch restart
sleep 60
#curl -XPUT 'http://localhost:9200/_snapshot/backups' -d '{"type": "fs", "settings": {"location": "/tmp/es-backups"}}'
cd $PLANNING_DIR/../superdesk/client/dist
nohup python -m http.server 9000 &
cd $PLANNING_DIR/../superdesk/server
echo "SUPERDESK_TESTING = True" | sudo tee -a ./settings.py
echo "DEBUG = True" | sudo tee -a ./settings.py
honcho start &
sleep 60
cd $PLANNING_DIR
./node_modules/.bin/webdriver-manager update --gecko=false
./node_modules/protractor/bin/protractor protractor.conf.js --stackTrace --verbose
