import sinon from 'sinon';

import {contentProfiles} from '../../api';
import {updateContentProfiles} from '../../actions/forms';
import {profiles, coverageProfiles} from '../../selectors/forms';
import {getProfileStateFromPayload} from '../../reducers/forms';
import {superdeskApi, planningApi} from '../../superdeskApi';
import {createTestStore} from '../../utils';

describe('forms', () => {
    describe('reducers', () => {
        const profileItems = [
            {_id: 'text', name: 'Text Coverage', type: 'coverage', content_type: 'text'},
            {_id: 'photo', name: 'Photo Coverage', type: 'coverage', content_type: 'photo'},
            {_id: 'default_coverage', name: 'Defaut Coverage', type: 'coverage'},
            {_id: 'event', name: 'Events', type: 'event'}
        ];

        it('getProfileStateFromPayload generates profile state from list of profiles', () => {
            expect(getProfileStateFromPayload([])).toEqual({profiles: {}, coverageProfiles: []});
            expect(getProfileStateFromPayload(profileItems)).toEqual({
                profiles: {event: profileItems[3], coverage: profileItems[2]},
                coverageProfiles: [profileItems[0], profileItems[1]],
            });
        });

        it('Loads profile data in their appropriate state', () => {
            const store = createTestStore()

            store.dispatch(updateContentProfiles([]));
            let state = store.getState();
            expect(state.forms.profiles).toEqual({})
            expect(state.forms.coverageProfiles).toEqual([]);

            store.dispatch(updateContentProfiles(profileItems));
            state = store.getState();
            expect(state.forms.profiles).toEqual({event: profileItems[3], coverage: profileItems[2]})
            expect(state.forms.coverageProfiles).toEqual([profileItems[0], profileItems[1]]);
        });
    });
});
