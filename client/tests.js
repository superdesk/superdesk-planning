import 'angular';
import 'angular-mocks';
import moment from 'moment';
import './';

import {appConfig} from 'appConfig';

Object.assign(appConfig, {
    server: {url: 'http://server.com'},
    // iframely: {key: '123'},
    view: {
        timeformat: 'HH:mm',
        dateformat: 'DD/MM/YYYY',
    },
    model: {dateformat: 'DD/MM/YYYY'},
    shortTimeFormat: 'HH:mm',
    defaultTimezone: 'Australia/Sydney',
});

moment.tz.setDefault('Australia/Sydney');
var testsContext = require.context('.', true, /_test.[j|t]sx?$/);

testsContext.keys().forEach(testsContext);
