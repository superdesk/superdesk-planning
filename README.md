# Superdesk Planning
_Sept 2016, Berlin_  
[![Build Status](https://travis-ci.org/superdesk/superdesk-planning.svg?branch=master)](https://travis-ci.org/superdesk/superdesk-planning)
## Overview
This is a plugin for [superdesk-client-core](https://github.com/superdesk/superdesk-client-core) and [superdesk-core](https://github.com/superdesk/superdesk-core). It adds a planning application page and a new tab in the settings with its API endpoints.

## Installation

The `superdesk-planning` node module is already included in `superdesk-core-client`.
But in order to see the planning feature in the application, you need to enable it.

### Client: Enable the superdesk-planning module
In `client/superdesk.config.js` from `superdesk`, add this line
```js
features : {planning: true},
```
This will import the `superdesk-planning` node module and load the `superdesk.planning` angular module in the main angular application.
### Server: Load the superdesk-planning module
```diff
--- a/server/settings.py
+++ b/server/settings.py
@@ -132,7 +131,8 @@ INSTALLED_APPS.extend([
+    'planning',
 ])
```

## Development

### Rules
All the code related to the planning feature must be part of this `superdesk-planning` repository.  
How?  By using the available superdesk services/providers. For instance, [ `Activities` has been used to add a settings page](https://github.com/superdesk/superdesk-planning/blob/38eddf535d0096c5484c82505483fd0b1e8fb0fc/index.js#L24-L31).  

Sometime, you may need to add something in the application and that is not possible yet to do by using the existing superdesk services/providers. In this case, a **generic** service/provider must be created in `superdesk-client-core` in order to obtain the wanted result.  
For instance, as these lines are written, there is no proper way to add an icon in the side navigation bar from this superdesk plugin. The `workspace` service could have a new method `registerExtraSidenavItemTemplateUrl` which we could call in our superdesk plugin to add a new icon at the bottom of the navigation bar.  
**It's important to document** these services/providers method, in [docs/superdesk.md](https://github.com/superdesk/superdesk-client-core/blob/master/docs/superdesk.md) for the moment, in order to make it easy for the next plugin developers.

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

Connect the repository to `superdesk-client-core`
```
npm link
cd /path/to/superdesk-client-core
npm link superdesk-planning
```
