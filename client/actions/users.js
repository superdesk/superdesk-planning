import {USER_ACTIONS} from '../constants';

const fetchUserPreferences = (force = false) => (
    (dispatch, getState, {preferencesService}) =>
        preferencesService.get(null, force)
            .then((data) => dispatch(self.receiveUserPreferences(data)))
);

const receiveUserPreferences = (preferences) => ({
    type: USER_ACTIONS.RECEIVE_USER_PREFERENCES,
    payload: preferences,
});


// eslint-disable-next-line consistent-this
const self = {
    fetchUserPreferences,
    receiveUserPreferences,
};

export default self;
