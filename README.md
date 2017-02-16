# Superdesk Planning
_Sept 2016, Berlin_  
[![Build Status](https://travis-ci.org/superdesk/superdesk-planning.svg?branch=master)](https://travis-ci.org/superdesk/superdesk-planning)
## Overview
This is a plugin for [superdesk](https://github.com/superdesk/superdesk).  
It allows to ingest and manage events, to create planning within agenda, and to link coverages to them.

## Installation in Superdesk

```
cd client
npm install superdesk/superdesk-planning
cd ../server
pip install git+git://github.com/superdesk/superdesk-planning.git@a5b14c23e#egg=superdesk-planning
```

In `client/superdesk.config.js`, add this line
```js
features : {planning: true},
```
This will import the `superdesk-planning` node module and load the `superdesk.planning` angular module in the main angular application.

In `server/settings.py`:

```diff
@@ -132,7 +131,8 @@ INSTALLED_APPS.extend([
+    'planning',
 ])
```

### Development setup

Download and install
```
git clone git@github.com:superdesk/superdesk-planning.git
make install
```
Run the tests
```
source server/env/bin/activate
make test
```
