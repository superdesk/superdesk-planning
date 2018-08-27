import {AUTOSAVE, ITEM_TYPE} from '../constants';
import {get, cloneDeep} from 'lodash';
import moment from 'moment';

import * as selectors from '../selectors';
import {
    getAutosaveItem,
    getItemType,
    getItemId,
    getErrorMessage,
    gettext,
    isTemporaryId,
    eventUtils,
    planningUtils,
    removeAutosaveFields,
} from '../utils';

/**
 * Action to fetch Autosave items for the given itemType and the current user
 * @param {string} itemType - The type of the item to retrieve (ITEM_TYPE.EVENT/ITEM_TYPE.PLANNING)
 */
const fetch = (itemType) => (
    (dispatch, getState, {api, notify}) => (
        api(`${itemType}_autosave`).query({
            where: JSON.stringify({
                lock_user: selectors.general.currentUserId(getState()),
            }),
        })
            .then(
                (autosaves) => dispatch(self.receive(itemType, cloneDeep(autosaves._items))),
                (error) => {
                    notify.error(
                        getErrorMessage(error, gettext('Failed to load {{ itemType }} autosaves.', {itemType}))
                    );

                    return Promise.reject(error);
                }
            )
    )
);

/**
 * Helper functions to retrieve Autosave items for Events, Planning items or both
 */
const fetchEvents = () => self.fetch(ITEM_TYPE.EVENT);
const fetchPlanning = () => self.fetch(ITEM_TYPE.PLANNING);
const fetchAll = () => (
    (dispatch) => Promise.all([
        dispatch(self.fetchEvents()),
        dispatch(self.fetchPlanning()),
    ])
);

/**
 * Action to fetch a single Autosave for the given itemType and itemId
 * If the Autosave is in the Redux store return that, otherwise send an API request
 * @param {string} itemType - The type of the item to retrieve (ITEM_TYPE.EVENT/ITEM_TYPE.PLANNING)
 * @param {string} itemId - The item ID to retrieve the Autosave entry for
 * @param {boolean} tryServer - If true will try to fetch from the server
 */
const fetchById = (itemType, itemId, tryServer = true) => (
    (dispatch, getState, {api}) => {
        // Attempt to retrieve the item from the local Redux store
        const autosaveItem = getAutosaveItem(
            selectors.forms.autosaves(getState()),
            itemType,
            itemId
        );

        if (autosaveItem || !tryServer) {
            return Promise.resolve(autosaveItem || null);
        }

        // Otherwise send an API request
        return api(`${itemType}_autosave`).getById(itemId)
            .then((item) => {
                if (itemType === ITEM_TYPE.EVENT) {
                    return Promise.resolve(
                        eventUtils.modifyForClient(cloneDeep(item), true)
                    );
                } else if (itemType === ITEM_TYPE.PLANNING) {
                    return Promise.resolve(
                        planningUtils.modifyForClient(cloneDeep(item))
                    );
                }

                return Promise.resolve(item);
            });
    }
);

/**
 * Action to store the Autosave items into the Redux store
 * @param {string} itemType - The type of the items to store (ITEM_TYPE.EVENT/ITEM_TYPE.PLANNING)
 * @param {Array} autosaves - An Array of items to store
 */
const receive = (itemType, autosaves) => ({
    type: AUTOSAVE.ACTIONS.RECEIVE_ALL,
    payload: {
        itemType,
        autosaves,
    },
});

/**
 * Action to save the dirty values for an item
 * This will first push the changes to the local Redux store, then send an API request to the server
 * And finally update the etag on response
 * @param {object} updates - The updated item
 */
const save = (updates) => (
    (dispatch, getState, {api, notify}) => {
        const itemId = getItemId(updates);
        const itemType = getItemType(updates);

        const original = getAutosaveItem(
            selectors.forms.autosaves(getState()),
            itemType,
            itemId
        );

        const updateFields = removeAutosaveFields(updates);

        if (itemType === ITEM_TYPE.EVENT) {
            eventUtils.modifyForServer(updateFields, false);
        } else if (itemType === ITEM_TYPE.PLANNING) {
            planningUtils.modifyForServer(updateFields);
        }

        // Only set the lock information when creating a new Autosave item
        if (!original) {
            updateFields.lock_action = isTemporaryId(itemId) ? 'create' : 'edit';
            updateFields.lock_user = selectors.general.currentUserId(getState());
            updateFields.lock_session = selectors.general.sessionId(getState());
            updateFields.lock_time = moment();
        }

        return api(`${itemType}_autosave`).save(
            original || {},
            updateFields
        )
            .then((updatedAutosave) => {
                dispatch({
                    type: AUTOSAVE.ACTIONS.RECEIVE,
                    payload: updatedAutosave,
                });

                return Promise.resolve(updatedAutosave);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to save the autosave item.'))
                );

                return Promise.reject(error);
            });
    }
);

/**
 * Action to remove an Autosave for an item from the local Redux store and the server
 * @param {object} autosave - The Autosave item to remove (must have '_id' and'type' fields)
 */
const remove = (autosave) => (
    (dispatch, getState, {api}) => {
        const itemType = getItemType(autosave);

        // If the item type is unknown
        // then this autosave does not exist
        if (itemType === ITEM_TYPE.UNKNOWN) {
            return Promise.resolve(autosave);
        }
        // Delete the changes from the local redux
        dispatch(self.removeLocalAutosave(autosave));

        // If the Autosave item does not have an etag
        // then it has not been saved to the server yet.
        if (!get(autosave, '_etag')) {
            return Promise.resolve();
        }

        return api(`${itemType}_autosave`).remove(autosave)
            .then(() => Promise.resolve(), () => Promise.resolve());
    }
);

/**
 * Action to remove an Autosave item by ID/Type only
 * The Autosave must be in the local Redux store to be removed
 * @param {string} itemType - The type of item to remove (ITEM_TYPE.EVENT/ITEM_TYPE.PLANNING)
 * @param {string} itemId - The ID of the item to remove the autosave for
 * @param {boolean} tryServer - If true will try to fetch from the server
 */
const removeById = (itemType, itemId, tryServer = true) => (
    (dispatch, getState, {notify, api}) => (
        api(`${itemType}_autosave`).getById(itemId)
            .then((autosaveItem) => {
                if (autosaveItem) {
                    return dispatch(self.remove({
                        ...autosaveItem,
                        _id: itemId,
                    }));
                }

                return Promise.resolve();
            }, (error) => {
                // auto save record is not then ignore the error.
                if (error.status !== 404) {
                    notify.error(
                        getErrorMessage(error, gettext('Failed to remove autosave. Not found'))
                    );

                    return Promise.reject(error);
                }

                // ensure that autosave is removed from redux
                dispatch(self.removeLocalAutosave({
                    _id: itemId,
                    type: itemType,
                }));

                return Promise.resolve();
            })
    )
);

const removeLocalAutosave = (item) => ({
    type: AUTOSAVE.ACTIONS.REMOVE,
    payload: item,
});

// eslint-disable-next-line consistent-this
const self = {
    save,
    remove,
    removeById,
    fetch,
    receive,
    fetchEvents,
    fetchPlanning,
    fetchAll,
    fetchById,
    removeLocalAutosave,
};

export default self;
