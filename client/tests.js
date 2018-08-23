import 'angular';
import 'angular-mocks';

import './';

var testsContext = require.context('.', true, /_test.[j|t]sx?$/);

testsContext.keys().forEach(testsContext);
