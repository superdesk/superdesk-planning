import {get} from 'lodash';

import {IArticle} from 'superdesk-api';
import {planningApi, superdeskApi} from '../superdeskApi';

import {ASSIGNMENTS} from '../constants';
import contacts from './contacts';
import {getStoredArchiveItems} from '../selectors';

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
    return (dispatch, getState) => {
        if (data.resource === 'planning_types') {
            planningApi.contentProfiles.updateProfilesInStore();
        } else if (['archive', 'archived', 'published'].includes(data.resource)) {
            const loadedArticles = getStoredArchiveItems(getState());

            if (loadedArticles[data._id] != null) {
                // This item is loaded into the Redux store, grab a fresh copy now
                superdeskApi.dataApi.findOne<IArticle>(data.resource, data._id).then((updatedItem) => {
                    dispatch({
                        type: ASSIGNMENTS.ACTIONS.RECEIVED_ARCHIVE,
                        payload: [updatedItem],
                    });
                });
            }
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
