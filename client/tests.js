import 'angular';
import 'angular-mocks';
import moment from 'moment';
import './';

moment.tz.setDefault('Australia/Sydney');
var testsContext = require.context('.', true, /_test.[j|t]sx?$/);

testsContext.keys().forEach(testsContext);
