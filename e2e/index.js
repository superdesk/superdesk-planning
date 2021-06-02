import {startApp} from 'superdesk-core/scripts/index';

setTimeout(() => {
    startApp(
        [{
            id: 'superdesk-planning',
            load: () => import('superdesk-planning/client/planning-extension'),
        }],
        {}
    );
});

export default angular.module('main.superdesk', []);
