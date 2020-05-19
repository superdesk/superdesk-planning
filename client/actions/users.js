import {preferredCoverageDesks, preferredAssignmentSort} from '../selectors/general';
import {USER_ACTIONS, COVERAGES, ASSIGNMENTS} from '../constants';
import {get, cloneDeep} from 'lodash';

const fetchAndRegisterUserPreferences = (force = false) => (
    (dispatch, getState, {preferencesService}) =>
        preferencesService.get(null, force)
            .then((data) => {
                dispatch(self.receiveUserPreferences(data));
            })
);

const receiveUserPreferences = (preferences) => ({
    type: USER_ACTIONS.RECEIVE_USER_PREFERENCES,
    payload: preferences,
});

/**
 * Action dispatcher to update the users' preferences in the db
 * @param {Object} updates - The list of updates to apply
 * @param {String} key - The key of the preference to update
 * @return {Promise} - A promise containing the result of the API call
 */
const updatePreferences = (updates, key) => (
    (dispatch, getState, {preferencesService}) => (
        preferencesService.update(updates, key)
            .then((updatedPreferences) => {
                dispatch(
                    self.receiveUserPreferences(
                        cloneDeep(updatedPreferences.user_preferences)
                    )
                );

                return Promise.resolve();
            })
    )
);

const setCoverageDefaultDesk = (coverage) => (
    (dispatch, getState) => {
        const coverageType = get(coverage, 'planning.g2_content_type');
        let coverageDeskPref = preferredCoverageDesks(getState());

        if (get(coverageDeskPref, `desks.${coverageType}`) !== get(coverage, 'assigned_to.desk')) {
            const update = {
                [COVERAGES.DEFAULT_DESK_PREFERENCE]: {
                    desks: {
                        ...get(coverageDeskPref, 'desks'),
                        [coverageType]: coverage.assigned_to.desk,
                    },
                },
            };

            return dispatch(
                self.updatePreferences(update, COVERAGES.DEFAULT_DESK_PREFERENCE)
            );
        }

        return Promise.resolve();
    }
);

const setCoverageAddAdvancedMode = (advancedMode) => (
    (dispatch) => {
        const update = {
            [COVERAGES.ADD_ADVANCED_MODE_PREFERENCE]: {
                enabled: advancedMode,
            },
        };

        return dispatch(updatePreferences(update, COVERAGES.ADD_ADVANCED_MODE_PREFERENCE));
    }
);

/**
 * Action dispatcher to set the assignment sort field user preference
 * @param {String} field - The new sort field to store
 * @returns {Promise} - A promise containing the result of the API call to save the preference
 */
const setAssignmentSortField = (field) => (
    (dispatch, getState) => {
        const currentPreference = preferredAssignmentSort(getState());

        if (get(currentPreference, 'sort.field') === field) {
            return Promise.resolve();
        }

        const update = {
            [ASSIGNMENTS.DEFAULT_SORT_PREFERENCE]: {
                sort: {
                    field: field,
                    order: get(currentPreference, 'sort.order') || {},
                },
            },
        };

        return dispatch(
            self.updatePreferences(update, ASSIGNMENTS.DEFAULT_SORT_PREFERENCE)
        );
    }
);

/**
 * Action dispatcher to set the assignment sort field user preference
 * @param {String} list - The list group key
 * @param {String} order - The sort order to use ('Asc' or 'Desc')
 * @returns {Promise} - A promise containing the result of the API call to save the preference
 */
const setAssignmentSortOrder = (list, order) => (
    (dispatch, getState) => {
        const currentPreference = preferredAssignmentSort(getState());

        if (get(currentPreference, `sort.order.${list}`) === order) {
            return Promise.resolve();
        }

        const update = {
            [ASSIGNMENTS.DEFAULT_SORT_PREFERENCE]: {
                sort: {
                    field: get(currentPreference, 'sort.field') || 'Scheduled',
                    order: {
                        ...get(currentPreference, 'sort.order', {}),
                        [list]: order,
                    },
                },
            },
        };

        return dispatch(
            self.updatePreferences(update, ASSIGNMENTS.DEFAULT_SORT_PREFERENCE)
        );
    }
);


// eslint-disable-next-line consistent-this
const self = {
    fetchAndRegisterUserPreferences,
    receiveUserPreferences,
    setCoverageDefaultDesk,
    updatePreferences,
    setAssignmentSortField,
    setAssignmentSortOrder,
    setCoverageAddAdvancedMode,
};

export default self;
