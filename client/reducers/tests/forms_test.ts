import sinon from 'sinon';

import {getTestActionStore} from '../../utils/testUtils';
import {contentProfiles} from '../../api';
import {updateContentProfiles} from '../../actions/forms';
import {profiles, coverageProfiles} from '../../selectors/forms';
import {getProfileStateFromPayload} from '../../reducers/forms';
import {superdeskApi, planningApi} from '../../superdeskApi';

fdescribe('forms', () => {
    describe('reducers', () => {
        let store;
        const profileItems = [
            {_id: 'text', name: 'Text Coverage', type: 'coverage', content_type: 'text'},
            {_id: 'photo', name: 'Photo Coverage', type: 'coverage', content_type: 'photo'},
            {_id: 'default_coverage', name: 'Defaut Coverage', type: 'coverage'},
            {_id: 'event', name: 'Events', type: 'event'}
        ];

        const expectEmptyProfilesInStore = () => {
            const state = store.getState();

            expect(state.forms.profiles).toEqual({})
            expect(state.forms.coverageProfiles).toEqual([]);
        }

        const expectCorrectProfilesInStore = () => {
            const state = store.getState();

            expect(state.forms.profiles).toEqual({event: profileItems[3], coverage: profileItems[2]})
            expect(state.forms.coverageProfiles).toEqual([profileItems[0], profileItems[1]]);
        };

        beforeEach(() => {
            store = getTestActionStore();
            store.init();
        });

        it('generates initialState from profiles data', () => {
            store.initialState.forms = {
                ...store.initialState.forms,
                ...getProfileStateFromPayload([]),
            };

            // Test the store with empty profiles
            let state = store.getState()

            expect(state.forms.profiles).toEqual({})
            expect(state.forms.coverageProfiles).toEqual([]);

            // Simulate constructing the state manually
            store.initialState.forms = {
                ...store.initialState.forms,
                ...getProfileStateFromPayload(profileItems),
            };

            // Test the store for profiles and coverageProfiles data
            expectCorrectProfilesInStore()
        });

        it('Loads profile data in their appropriate state', () => {
            store.dispatch(updateContentProfiles([]));
            let state = store.getState();

            expect(state.forms.profiles).toEqual({});
            expect(state.forms.coverageProfiles).toEqual([]);

            store.dispatch(updateContentProfiles(profileItems));
            expectCorrectProfilesInStore();
        });
    });
});
