import {startApp} from 'superdesk-core/scripts/index';

setTimeout(() => {
    startApp(
        [{
            id: 'planning-extension',
            load: () => (
                import('@superdesk/planning-extension')
            ),
        }],
        {}
    );
});

export default angular.module('main.superdesk', []);
