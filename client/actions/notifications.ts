import {get} from 'lodash';

import {IArticle} from 'superdesk-api';
import {planningApi, superdeskApi} from '../superdeskApi';

import {ASSIGNMENTS} from '../constants';
import contacts from './contacts';
import {getStoredArchiveItems} from '../selectors';
import {updateTemplates} from './exportTemplates';
import {IPlanningExportTemplate} from 'interfaces';
import {getExportTemplates} from '../selectors/general';
import {PLANNING_EXPORT_TEMPLATES_RESOURCE} from '../constants/exportTemplates';

type NotificationHandler = (_e: any, data: any) => (dispatch: any, getState?: any) => any;

type NotificationActions = {
    onContactsUpdated: NotificationHandler;
    onResourceCreatedOrUpdated: NotificationHandler;
    onResourceDeleted: NotificationHandler;

    events?: {
        [key: string]: NotificationHandler;
    };
};

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
        } else if (data.resource === PLANNING_EXPORT_TEMPLATES_RESOURCE) {
            superdeskApi.dataApi.findOne<IPlanningExportTemplate>(data.resource, data._id)
                .then((template) => {
                    const existingTemplates = getExportTemplates(getState()) ?? [];

                    const updatedTemplates = (() => {
                        const maybeExistingTemplate = existingTemplates.find((t) => t._id === template._id);

                        if (maybeExistingTemplate === null) { // new template
                            return [...existingTemplates, template];
                        } else {
                            return existingTemplates.map((t) => t._id === template._id ? template : t);
                        }
                    })();

                    dispatch(updateTemplates(updatedTemplates));
                });
        }
    };
}

const onResourceDeleted = (_e, data) => (dispatch, getState) => {
    if (data.resource === PLANNING_EXPORT_TEMPLATES_RESOURCE) {
        const updatedTemplates = getExportTemplates(getState())
            .filter((t) => t._id !== data._id);

        dispatch(updateTemplates(updatedTemplates));
    }
};

// eslint-disable-next-line consistent-this
const self: NotificationActions = {
    onContactsUpdated,
    onResourceCreatedOrUpdated,
    onResourceDeleted,
};

// Map of notification name and Action Event to execute
self.events = {
    'contacts:update': () => self.onContactsUpdated,
    'resource:updated': () => self.onResourceCreatedOrUpdated,
    'resource:created': () => self.onResourceCreatedOrUpdated,
    'resource:deleted': () => self.onResourceCreatedOrUpdated,
};

export default self;
