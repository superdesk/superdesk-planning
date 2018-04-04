import {USER_ACTIONS} from '../constants';

const setUserPreferences = (preferences) => ({
    type: USER_ACTIONS.SET_USER_PREFERNCES,
    payload: preferences,
});


// eslint-disable-next-line consistent-this
const self = {
    setUserPreferences
};

export default self;
