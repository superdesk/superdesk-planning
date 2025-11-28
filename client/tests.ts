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

updateConfigAfterLoad();

beforeEach(() => {
    moment.tz.setDefault('Australia/Sydney');
});

var testsContext = require.context('.', true, /_test\.[jt]sx?$/);

if (process.env.TEST_FILE_PATTERN) {
    // Allow running specific test files via TEST_FILE_PATTERN env variable
    // Usage: npm run test:file --file=AddToPlanningController
    const testPattern = new RegExp(process.env.TEST_FILE_PATTERN + '_test\\.[jt]sx?$');

    testsContext.keys()
        .filter((path) => testPattern.test(path))
        .forEach(testsContext);
} else {
    testsContext.keys().forEach(testsContext);
}
