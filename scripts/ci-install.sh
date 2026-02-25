#!/usr/bin/env bash

# Install python package dependencies
sudo apt-get -y update
sudo apt-get -y install libxml2-dev libxmlsec1-dev libxmlsec1-openssl

git config --global url."https://git@".insteadOf git://

if [ "$INSTALL_NODE_MODULES" == "true" ]; then
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
fi
