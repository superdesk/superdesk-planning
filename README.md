# Superdesk Planning
_Sept 2016, Berlin_  
[![Build Status](https://travis-ci.org/superdesk/superdesk-planning.svg?branch=master)](https://travis-ci.org/superdesk/superdesk-planning)
[![Coverage Status](https://coveralls.io/repos/github/superdesk/superdesk-planning/badge.svg?branch=master)](https://coveralls.io/github/superdesk/superdesk-planning?branch=master)

## Overview
This is a plugin for [superdesk](https://github.com/superdesk/superdesk).  
It allows to ingest and manage events, to create planning within agenda, and to link coverages to them.

## Configure Superdesk
In order for Superdesk to expose the Planning module, you must configure it in both the client and server config files.

### Client
Add the dependency to your instance of superdesk.  
In `superdesk/client/package.json` add `superdesk-planning` to the dependencies
(replacing `#a79d428` with the specific commit you require):
```js
"dependencies": {
    ....,
    "superdesk-planning": "superdesk/superdesk-planning#a79d428"
}
```

Don't forget to add planning to your superdesk config in `superdesk/client/superdesk.config.js`, and
to enable the planning feature:
```js
apps: [
    ....,
    'superdesk-planning'
],
features: {
    ....,
    planning: true
}
```

This will import the `superdesk-planning` node module and load the `superdesk.planning` angular module in the main angular application.

### Server
Add the dependency to your instance of superdesk.
In `superdesk/server/requirements.txt` add `superdesk-planning` to the dependencies
(replacing `@a5b14c23e` with the specific commit you require):
```
git+git://github.com/superdesk/superdesk-planning.git@a5b14c23e#egg=superdesk-planning
```

Last thing you need to configure is to add `planning` to the list of installed apps.  
In `superdesk/server/settings.py` add the following:
```python
INSTALLED_APPS.extend([
    ....,
    'planning'
])
```

## Install for Production/Testing
Installing Superdesk-Planning for production or test environments is as easy as running the following:
```
cd superdesk/client
npm install
cd ../server
pip install -r requirements.txt
cd ../..
```

## Install for Development

First you will need to clone the repo from GitHub.  
In the root folder where your current superdesk folder is, run the following:
```
git clone git@github.com:superdesk/superdesk-planning.git
```

### Client
Running the following will link the superdesk-planning module in development mode:
```
cd superdesk/client
npm install
npm link ../../superdesk-planning
cd ../..
```

### Server

Run the following to install the python module in development mode:
```
cd superdesk/server
pip install -r requirements.txt
cd ../../superdesk-planning
pip install -e .
cd ..
```


## Running Tests

To run the same tests that is used in Travis, run the following:
```
cd superdesk-planning
make test
cd ..
```

Or you can run them individually as below.

### Client
Code Style
```
cd superdesk-planning
npm run hint
cd ..
```

Unit Tests
```
cd superdesk-planning
npm run unit_test
cd ..
```

Coverage Report
```
cd superdesk-planning
npm run coveralls
cd ..
```

### Server

Code Style
```
cd superdesk-planning/server
flake8
cd ../..
```

Unit Tests
```
cd superdesk-planning/server
nosetests -v
cd ../..
```

Behaviour Tests
```
cd superdesk-planning/server
behave
cd ../..
```