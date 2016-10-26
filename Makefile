
BACKEND_DIR = server
VENV = `pwd`/${BACKEND_DIR}/env/bin/activate
test:
	flake8 ${BACKEND_DIR}
	cd ${BACKEND_DIR} ; nosetests -v
	cd ${BACKEND_DIR} ; behave
	npm run test_all
install:
	virtualenv  -p python3  ${BACKEND_DIR}/env
	. ${VENV} ; pip install --upgrade pip
	. ${VENV} ; pip install -r ${BACKEND_DIR}/requirements.txt
	npm install
