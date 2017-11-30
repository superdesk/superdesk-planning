import 'angular';
import 'angular-mocks';

import './';

var testsContext = require.context('.', true, /_test.jsx?$/);

testsContext.keys().forEach(testsContext);
