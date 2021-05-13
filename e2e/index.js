import {startApp} from 'superdesk-core/scripts/index';

setTimeout(() => {
    startApp(
        [{
            id: 'planning-extension',
            load: () => (
                import('superdesk-planning/client/planning-extension/dist/planning-extension/src/extension')
            ),
        }],
        {}
    );
});

export default angular.module('main.superdesk', []);
