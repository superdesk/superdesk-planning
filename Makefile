
BACKEND_DIR = server
VENV = `pwd`/${BACKEND_DIR}/env/bin/activate
test: testpy testjs
install:
	virtualenv  -p python3  ${BACKEND_DIR}/env
	. ${VENV} ; pip install --upgrade pip
	. ${VENV} ; pip install -r ${BACKEND_DIR}/requirements.txt
	npm install
	test_py:
testjs:
	npm run test
testpy:
	flake8 ${BACKEND_DIR}
	cd ${BACKEND_DIR} ; nosetests -v --with-coverage --cover-package=planning
	mv  ${BACKEND_DIR}/.coverage .coverage.nosetests
	cd ${BACKEND_DIR} ; coverage run --source planning --omit "*tests*" -m behave
	mv  ${BACKEND_DIR}/.coverage .coverage.behave
	coverage combine .coverage.behave .coverage.nosetests
