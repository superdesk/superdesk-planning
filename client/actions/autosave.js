import {AUTOSAVE, ITEM_TYPE} from '../constants';
import {get, pickBy} from 'lodash';
import moment from 'moment';

import * as selectors from '../selectors';
import {getAutosaveItem, getItemType, getItemId, getErrorMessage, gettext} from '../utils';

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
                (autosaves) => dispatch(self.receive(itemType, autosaves._items)),
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
        return api(`${itemType}_autosave`).getById(itemId);
    }
);

/**
 * Action to store the Autosave items into the Redux store
 * @param {string} itemType - The type of the items to store (ITEM_TYPE.EVENT/ITEM_TYPE.PLANNING)
 * @param {Array} autosaves - An Array of items to store
 */
const receive = (itemType, autosaves) => ({
    type: AUTOSAVE.ACTIONS.RECEIVE,
    payload: {
        itemType,
        autosaves,
    },
});

/**
 * Action to save the dirty values for an item
 * This will first push the changes to the local Redux store, then send an API request to the server
 * And finally update the etag on response
 * @param {object} item - The updated item
 * @param {string} action - The action for this autosave (i.e. create/edit)
 * @param {boolean} saveToServer - If true sends API request to save the autosave on the server
 */
const save = (item, action = 'edit', saveToServer = true) => (
    (dispatch, getState, {api, notify}) => {
        const itemId = getItemId(item);
        const itemType = getItemType(item);

        const originalAutosave = getAutosaveItem(
            selectors.forms.autosaves(getState()),
            itemType,
            itemId
        ) || {};

        // Merge the original autosave item (if any) with the new changes
        const autosaveItem = {
            ...originalAutosave,
            ...pickBy(item, (value, key) => (
                key === '_planning_item' ||
                key === '_id' ||
                !key.startsWith('_')
            )),
            // Set the lock_ fields to the current user/session/time
            lock_action: get(originalAutosave, 'lock_action') || action,
            lock_user: selectors.general.currentUserId(getState()),
            lock_session: selectors.general.sessionId(getState()),
            lock_time: get(originalAutosave, 'lock_time') || moment(),
        };

        if (itemType === ITEM_TYPE.EVENT) {
            autosaveItem.location = autosaveItem.location ? [autosaveItem.location] : [];

            if (autosaveItem._planning_item === null) {
                delete autosaveItem._planning_item;
            }
        }

        // Push the changes to the local redux
        dispatch({
            type: AUTOSAVE.ACTIONS.SAVE,
            payload: autosaveItem,
        });

        if (!saveToServer) {
            return Promise.resolve(autosaveItem);
        }

        return api(`${itemType}_autosave`).save(originalAutosave, autosaveItem)
            .then((updatedAutosave) => {
                dispatch({
                    type: AUTOSAVE.ACTIONS.UPDATE_ETAG,
                    payload: {
                        itemType: itemType,
                        item: updatedAutosave,
                    },
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
        dispatch({
            type: AUTOSAVE.ACTIONS.REMOVE,
            payload: autosave,
        });

        // If the Autosave item does not have an etag
        // then it has not been saved to the server yet.
        if (!get(autosave, '_etag')) {
            return Promise.resolve();
        }

        return api(`${itemType}_autosave`).remove(autosave);
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
    (dispatch, getState, {notify}) => (
        dispatch(self.fetchById(itemType, itemId, tryServer))
            .then((autosaveItem) => {
                if (autosaveItem) {
                    dispatch(self.remove({
                        ...autosaveItem,
                        _id: itemId,
                    }));
                }

                return Promise.resolve();
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to remove autosave. Not found'))
                );

                return Promise.reject(error);
            })
    )
);

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
};

export default self;
