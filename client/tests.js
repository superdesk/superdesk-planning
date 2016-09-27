import 'angular';
import 'angular-mocks';

import './';

var testsContext = require.context('.', true, /_test.js$/);
testsContext.keys().forEach(testsContext);
