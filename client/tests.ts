import 'angular';
import 'angular-mocks';
import moment from 'moment';
import './';

import {appConfig} from 'appConfig';
import {updateConfigAfterLoad} from './config';
import './utils/testApi';

Object.assign(appConfig, {
    server: {url: 'http://server.com'},
    view: {
        timeformat: 'HH:mm',
        dateformat: 'DD/MM/YYYY',
    },
    model: {dateformat: 'DD/MM/YYYY'},
    shortTimeFormat: 'HH:mm',
    default_timezone: 'Australia/Sydney',
    profileLanguages: ['en', 'fr_CA'],
    planning_auto_assign_to_workflow: true,
});

moment.tz.setDefault('Australia/Sydney');
updateConfigAfterLoad();

var testsContext = require.context('.', true, /_test.[j|t]sx?$/);

testsContext.keys().forEach(testsContext);
