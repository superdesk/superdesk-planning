
BACKEND_DIR = server
VENV = `pwd`/${BACKEND_DIR}/env/bin/activate
PLANNING_DIR=`pwd`
run_unit: testpy testjs
install_unit:
	npm install --python=python2.7
	cd server && pip install -r requirements.txt && cd ..
	gem install coveralls-lcov
install_e2e:
	ls -la
	pwd
	mkdir e2e
	cd e2e
	ls -la
	pwd
	git clone https://github.com/superdesk/superdesk.git
	ls -la
	cd superdesk
	pwd
	ls -la
	git checkout planning-mvp
	npm install --python=python2.7
	npm install -g grunt-cli
	cd server && pip install -r requirements.txt && cd ..
	cd client && npm install && grunt build && cd ..
	sudo sed -i 's\enabled: true\enabled: false\' /etc/mongod.conf
	sudo service mongod restart
	mkdir /tmp/es-backups
	&& sudo chown elasticsearch:elasticsearch /tmp/es-backups
	&& echo "path.repo: ['/tmp/es-backups']" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
	&& echo "index.store.type: memory" | sudo tee -a /etc/elasticsearch/elasticsearch.yml
	&& sudo service elasticsearch restart
	&& sleep 10
	&& curl -XPUT 'http://localhost:9200/_snapshot/backups' -d '{"type": "fs", "settings": {"location": "/tmp/es-backups"}}
testjs:
	npm run test
testpy:
	flake8 ${BACKEND_DIR}
	cd ${BACKEND_DIR} ; nosetests -v --with-coverage --cover-package=planning
	mv  ${BACKEND_DIR}/.coverage .coverage.nosetests
	cd ${BACKEND_DIR} ; coverage run --source planning --omit "*tests*" -m behave --format progress2 --logging-level=ERROR
	mv  ${BACKEND_DIR}/.coverage .coverage.behave
	coverage combine .coverage.behave .coverage.nosetests
run_e2e:
	cd ${PLANNING_DIR}/e2e/client/dist
	nohup python -m http.server 9000 &
	cd ${PLANNING_DIR}/e2e/server
	honcho start &
	sleep 10
	cd ${PLANNING_DIR}
	./node_modules/protractor/bin/protractor protractor.conf.js --stackTrace --verbose
