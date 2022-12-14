#!/usr/bin/env bash

# Install python package dependencies
sudo apt-get -y update
sudo apt-get -y install libxml2-dev libxmlsec1-dev libxmlsec1-openssl

# Update python core packages
python -m pip install --upgrade pip wheel setuptools

if [ "$INSTALL_NODE_MODULES" == "true" ]; then
    git config --global url."https://git@".insteadOf git://
    npm install
fi

if [ "$INSTALL_PY_MODULES" == "true" ]; then
    pip install -r server/requirements.txt
fi

if [ "$INSTALL_PY_EDITABLE" == "true" ]; then
    pip install -e .
fi

if [ "$E2E" == "true" ]; then
    cd e2e/server
    pip install -r requirements.txt
    cd ../
    git config --global url."https://git@".insteadOf git://
    npm install
fi
