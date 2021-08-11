import {get} from 'lodash';

import {planningApi} from '../superdeskApi';

import contacts from './contacts';

/**
 * WS Action when a new Planning item is created
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onContactsUpdated = (_e, data) => (
    (dispatch) => {
        if (get(data, '_id')) {
            return dispatch(contacts.getContactById(data._id));
        }

        return Promise.resolve();
    }
);

function onResourceCreatedOrUpdated(_e, data) {
    return () => {
        if (data.resource === 'planning_types') {
            planningApi.contentProfiles.updateProfilesInStore();
        }
    };
}

// eslint-disable-next-line consistent-this
const self = {
    onContactsUpdated,
    onResourceCreatedOrUpdated,
};

// Map of notification name and Action Event to execute
self.events = {
    'contacts:update': () => self.onContactsUpdated,
    'resource:updated': () => self.onResourceCreatedOrUpdated,
    'resource:created': () => self.onResourceCreatedOrUpdated,
};

export default self;
