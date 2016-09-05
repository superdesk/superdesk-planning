# Superdesk-planning
_Sept 2016, Berlin_

## Overview
This is a plugin for [superdesk-client-core](https://github.com/superdesk/superdesk-client-core). It adds a planning application page and a new tab in the settings.

## Installation
The `superdesk-planning` node module is already included in `superdesk-core-client`.
But in order to see the planning feature in the application, you need to enable it.

### Enable the superdesk-planning module
In `client/superdesk.config.js` from `superdesk`, add this line
```js
features : {planning: true},
```
This will import the `superdesk-planning` node module and load the `superdesk.planning` angular module in the main angular application.

## Development rules

All the code related to the planning feature must be part of this `superdesk-planning` repository.  
How?  By using the available superdesk services/providers. For instance, [we used `Activities` to add a settings page](https://github.com/vied12/superdesk-planning/blob/38eddf535d0096c5484c82505483fd0b1e8fb0fc/index.js#L24-L31).  

Sometime, you may need to add something in the application and that is not possible yet to do by using the existing superdesk services/providers. In this case, a **generic** service/provider must be created in `superdesk-client-core` in order to perform the wanted result.  
For instance, as these lines are written, there is no way to add an icon in the side navigation bar. The `workspace` service could have a new method `registerExtraSidenavItemTemplateUrl` which we could call in our superdesk plugin to add a new icon at the bottom of the navigation bar.  
**It's important to document** these services/providers method, in [docs/superdesk.md](https://github.com/superdesk/superdesk-client-core/blob/master/docs/superdesk.md) for the moment, in order to make it easy for the next plugin developers.
