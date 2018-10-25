import {preferredCoverageDesks} from '../selectors/general';
import {USER_ACTIONS, COVERAGES} from '../constants';
import {get} from 'lodash';

const fetchAndRegisterUserPreferences = (force = false) => (
    (dispatch, getState, {preferencesService}) =>
        preferencesService.get(null, force)
            .then((data) => {
                dispatch(self.receiveUserPreferences(data));
                preferencesService.registerUserPreference(COVERAGES.DEFAULT_DESK_PREFERENCE);
            })
);

const receiveUserPreferences = (preferences) => ({
    type: USER_ACTIONS.RECEIVE_USER_PREFERENCES,
    payload: preferences,
});

const setCoverageDefaultDesk = (coverage) => (
    (dispatch, getState, {preferencesService}) => {
        const coverageType = get(coverage, 'planning.g2_content_type');
        let coverageDeskPref = preferredCoverageDesks(getState());

        if (get(coverageDeskPref, `desks.${coverageType}`) !== get(coverage, 'assigned_to.desk')) {
            const update = {
                'planning:default_coverage_desks': {
                    desks: {
                        ...get(coverageDeskPref, 'desks'),
                        [coverageType]: coverage.assigned_to.desk,
                    },
                },
            };

            return preferencesService.update(update, 'planning:default_coverage_desks')
                .then((updatedPreferences) => {
                    dispatch(self.receiveUserPreferences({...updatedPreferences.user_preferences}));
                    return Promise.resolve();
                });
        }

        return Promise.resolve();
    }
);


// eslint-disable-next-line consistent-this
const self = {
    fetchAndRegisterUserPreferences,
    receiveUserPreferences,
    setCoverageDefaultDesk,
};

export default self;
