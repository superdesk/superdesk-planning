import 'angular';
import 'angular-mocks';
import moment from 'moment';
import {cloneDeep} from 'lodash';
import './';

import {appConfig, debugInfo} from 'appConfig';
import {updateConfigAfterLoad} from './config';
import {superdeskApi, planningApi} from './superdeskApi';
import {initialState} from './utils/testData';

debugInfo.translationsLoaded = true; // don't print warnings about missing translations when running unit tests

Object.assign(appConfig, {
    server: {url: 'http://server.com'},
    view: {
        timeformat: 'HH:mm',
        dateformat: 'DD/MM/YYYY',
    },
    model: {dateformat: 'DD/MM/YYYY'},
    shortTimeFormat: 'HH:mm',
    defaultTimezone: 'Australia/Sydney',
    profileLanguages: ['en', 'fr_CA'],
});

Object.assign(superdeskApi, {
    localization: {
        gettext: (text) => text,
    },
});

Object.assign(planningApi, {
    redux: {
        store: {
            getState: () => cloneDeep(initialState),
        },
    },
});

moment.tz.setDefault('Australia/Sydney');
updateConfigAfterLoad();

var testsContext = require.context('.', true, /_test.[j|t]sx?$/);

testsContext.keys().forEach(testsContext);
