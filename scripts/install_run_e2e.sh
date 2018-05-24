#!/bin/bash -e
BACKEND_DIR=server
VENV=`pwd`/$BACKEND_DIR/env/bin/activate
PLANNING_DIR=`pwd`
mkdir e2e && cd e2e
git clone https://github.com/superdesk/superdesk.git
cd superdesk
git checkout planning-mvp
npm install --python=python2.7
npm install -g grunt-cli
cd server && pip install -r requirements.txt && cd ..
cd client && npm install && grunt build && cd ..
pwd
ls -la
ls -la $PLANNING_DIR/e2e/
ls -la $PLANNING_DIR
sudo sed -i 's\enabled: true\enabled: false\' /etc/mongod.conf
sudo service mongod restart
mkdir /tmp/es-backups
sudo chown elasticsearch:elasticsearch /tmp/es-backups
echo "path.repo: ['/tmp/es-backups']" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
echo "index.store.type: memory" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
sudo service elasticsearch restart
sleep 10
curl -XPUT 'http://localhost:9200/_snapshot/backups' -d '{"type": "fs", "settings": {"location": "/tmp/es-backups"}}'
cd $PLANNING_DIR/e2e/superdesk/client/dist
nohup python -m http.server 9000 &
cd $PLANNING_DIR/e2e/superdesk/server
echo "SUPERDESK_TESTING = True" | sudo tee -a ./settings.py
echo "DEBUG = True" | sudo tee -a ./settings.py
# echo "MONGO_DBNAME = 'superdesk_e2e'" | sudo tee -a ./settings.py
# echo "MONGO_URI = 'mongodb://localhost/%s' % MONGO_DBNAME" | sudo tee -a ./settings.py
# echo "ELASTICSEARCH_INDEX = MONGO_DBNAME" | sudo tee -a ./settings.py
# echo "REDIS_URL='redis://localhost:6379/2'" | sudo tee -a ./settings.py
# echo "WEB_CONCURRENCY=3" | sudo tee -a ./settings.py
# echo "WEB_TIMEOUT=5" | sudo tee -a ./settings.py
cd ./node_modules/superdesk-core/test-server/
nohup python manage.py
nohup honcho start &
sleep 60
cd $PLANNING_DIR
./node_modules/.bin/webdriver-manager update
./node_modules/protractor/bin/protractor protractor.conf.js --stackTrace --verbose
