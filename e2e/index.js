import {startApp} from 'superdesk-core/scripts/index';

setTimeout(() => {
    startApp(
        [{
            id: 'planning-extension',
            load: () => (
                import('superdesk-planning/client/planning-extension/dist/planning-extension/src/extension')
                    .then((res) => res.default)
            ),
        }],
        {}
    );
});

export default angular.module('main.superdesk', []);
