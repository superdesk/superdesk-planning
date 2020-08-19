# Superdesk Planning
[![Build Status](https://travis-ci.org/superdesk/superdesk-planning.svg?branch=master)](https://travis-ci.org/superdesk/superdesk-planning)
[![Coverage Status](https://coveralls.io/repos/github/superdesk/superdesk-planning/badge.svg?branch=master)](https://coveralls.io/github/superdesk/superdesk-planning?branch=master)

## Overview
This is a plugin for [superdesk](https://github.com/superdesk/superdesk).  
It allows to ingest and manage events, to create planning within agenda, and to link coverages to them.

## Table of contents
* [Installation](#installation)
    * [Client](#install-client)
    * [Server](#install-server)
    * [Development](#install-for-development)
* [Config](#config)
    * [System](#system-config)
    * [Events](#event-config)
    * [Planning](#planning-config)
    * [Assignments](#assignments-config)
    * [Authoring](#authoring-config)
* [Slack Integration](#slack-integration)
* [Celery Tasks](#celery-tasks)
    * [Expire Items](#celery-tasks-expire-items)
    * [Delete Spiked](#celery-tasks-delete-spiked)
    * [Delete Assignments](#celery-tasks-delete-assignments)
* [Testing](#running-tests)
    * [Client](#tests-client)
    * [Server](#tests-server)
    

## Installation
In order for Superdesk to expose the Planning module, you must configure it in both the client and server config files.

### Install Client
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
},
workspace: {
    ....,
    planning: true,
    assignments: true
}
```

If you have `importApps` in your superdesk config, you should also add planning to this list:
```js
importApps: [
    ....,
    'superdesk-planning'
]
```

This will import the `superdesk-planning` node module and load the `superdesk.planning` angular module in the main angular application.

Finally install planning for javascript:
```
npm install
```

### Install Server
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

Finally install planning for Python:
```
pip install -r requirements.txt
```

### Install for Development
After performing the above steps, you can enable editing of your local copy for use with development.

First you will need to clone the repo from GitHub.  
In the root folder where your current superdesk folder is, run the following:
```
git clone git@github.com:superdesk/superdesk-planning.git
```

#### Client
Running the following will link the superdesk-planning module in development mode:
```
cd superdesk/client
npm install
npm link ../../superdesk-planning
cd ../..
```

#### Server
Run the following to install the python module in development mode:
```
cd superdesk/server
pip install -r requirements.txt
cd ../../superdesk-planning
pip install -e .
cd ..
```

## Config
Below sections include the config options that can be defined in settings.py.

### System Config
* PLANNING_EXPIRY_MINUTES
    * Defaults to 0 - disabled
* PLANNING_DELETE_SPIKED_MINUTES
    * Defaults to 0 - disabled

### Event Config
* MAX_RECURRENT_EVENTS:
    * Defaults to 200
    * Defines an upper limit to how many events can be created in a recurring series of Events.
* STREET_MAP_URL:
    * Defaults to 'https://www.google.com.au/maps/?q='
    * Defines the generated url used when clicking on a location of an Event.
* MAX_MULTI_DAY_EVENT_DURATION:
    * Defaults to 7
    * Defines the maximum number of days a single event can span.
* PLANNING_EVENT_TEMPLATES_ENABLED:
    * Defaults to False
    * Enables the ability to create templates from an existing Event, and use them for creating new Events.
* EVENT_EXPORT_BODY_TEMPLATE:
    * default: https://github.com/superdesk/superdesk-planning/blob/develop/server/planning/planning_export_templates.py#L39
    * Overrides the default event template used for event exports

### Planning Config
* LONG_EVENT_DURATION_THRESHOLD:
    * Defaults to -1 - disabled
* PLANNING_EXPORT_BODY_TEMPLATE:
    * Default: https://github.com/superdesk/superdesk-planning/blob/develop/server/planning/planning_export_templates.py#L39
    * Overrides the default event template used for planning exports

### Assignments Config
* SLACK_BOT_TOKEN
    * Defaults to ''
    * The Bot User OAuth Token for access to Slack
* PLANNING_AUTO_ASSIGN_TO_WORKFLOW
    * Defaults to false
    * Automatically assigned a coverage to workflow

### Authoring Config
* PLANNING_CHECK_FOR_ASSIGNMENT_ON_PUBLISH
    * Defaults to false
    * If true, check for unfulfilled assignments when publishing a story
* PLANNING_LINK_UPDATES_TO_COVERAGES
    * Defaults to false
    * If true, links content update to the assignment of the parent item
* PLANNING_FULFIL_ON_PUBLISH_FOR_DESKS
    * Defaults to ''
    * Desk IDs to display fulfil challenge on publish (requires PLANNING_CHECK_FOR_ASSIGNMENT_ON_PUBLISH=true)
* PLANNING_CHECK_FOR_ASSIGNMENT_ON_SEND
    * Defaults to false
    * If true, check for unfulfilled assignments when sending a story from an authoring desk to production desk
* PLANNING_ALLOWED_COVERAGE_LINK_TYPES
    * Defaults to []
    * This is an allow list of content types (text, picture etc) that can be linked to a coverage
    * If this option is not defined, or is an empty array, then all content types can be linked
    * Otherwise only the content types in the list are allowed to be linked to a coverage
    * This includes fulfilment of an Assignment

## Slack Integration
There are a couple of steps to take to enable slack for assignment notifications.

* Add `features.slackNotifications: 1` to your superdesk.config.js file
* Configure a SLACK_BOT_TOKEN in your settings.py
* Add `slackclient==1.0.9` to your requirements.txt file, and install using pip
* Configure slack channel/user names in the Superdesk UI
    * `SLACK CHANNEL NAME` in the `General` tab for a desk
    * `SLACK USERNAME` in the `Overview` of each user

## Celery Tasks
The following are celery tasks configured to perform periodic tasks specific to Planning. 

### Celery Tasks: Expire Items
There is a Celery Task to expire items after a configured amount of time.

In your settings.py, configure CELERY_TASK_ROUTES, CELERY_BEAT_SCHEDULE
and PLANNING_EXPIRY_MINUTES:
```
CELERY_TASK_ROUTES['planning.flag_expired'] = {
    'queue': celery_queue('expiry'),
    'routing_key': 'expiry.planning'
}

CELERY_BEAT_SCHEDULE['planning:expiry'] = {
    'task': 'planning.flag_expired',
    'schedule': crontab(minute='0')
}

PLANNING_EXPIRY_MINUTES = 4320 # default is 0
```

The above example config will run the Celery Task once every hour,
flagging items as expired after 3 days from the scheduled date.

If PLANNING_EXPIRY_MINUTES = 0, then no item will be flagged as expired (effectively disabling this feature)

There is also a manage.py command so that you can manually run this task.
```
python manage.py planning:flag_expired
```

### Celery Tasks: Delete Spiked
This is a Celery Task to delete spiked planning items, associated assignments and events after a configured amount of time.
Settings are very similar to "planning:flag_expired" task

In your settings.py, configure this task as follows using the variable PLANNING_DELETE_SPIKED_MINUTES:
```
CELERY_TASK_ROUTES['planning.delete_spiked'] = {
    'queue': celery_queue(''),
    'routing_key': 'delete.planning'
}

CELERY_BEAT_SCHEDULE['planning:delete'] = {
    'task': 'planning.delete_spiked',
    'schedule': crontab(minute='0')
}

PLANNING_DELETE_SPIKED_MINUTES = 4320 # default is 0
```

The above example config will run the Celery Task once every hour,
deleting spiked items after 3 days from the scheduled date.

If PLANNING_EXPIRY_MINUTES = 0, then no item will be deleted

There is also a manage.py command so that you can manually run this task.
```
python manage.py planning:delete_spiked
```

### Celery Tasks: Delete Assignments
This is a Celery Task to delete Assignments that have been marked by the system to be removed.
This can happen when the Coverage is cancelled but the Assignemnt or content item is currently locked.
This task will later on attempt to remove the Assignment once it is unlocked by the user.

The following is the default config if one is not defined:
```
CELERY_TASK_ROUTES['planning.delete_assignments'] = {
    'queue': celery_queue('expiry'),
    'routing_key': 'expiry.delete_assignments'
}

CELERY_BEAT_SCHEDULE['lanning:delete_assignments'] = {
    'task': 'planning.delete_assignments',
    'schedule': crontab(seconds=60)
}
```

## Running Tests

To run the same tests that is used in Travis, run the following:
```
cd superdesk-planning
make test
cd ..
```

Or you can run them individually as below.

### Tests: Client
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

### Tests: Server

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
