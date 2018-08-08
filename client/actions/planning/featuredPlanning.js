import {showModal, hideModal} from '../index';
import planningApi from './api';
import planningUi from './ui';
import {locks} from '../index';
import main from '../main';

import {
    getErrorMessage,
    gettext,
    getIdForFeauturedPlanning,
    planningUtils,
} from '../../utils';

import * as selectors from '../../selectors';
import {MODALS, FEATURED_PLANNING, SPIKED_STATE} from '../../constants';
import {get, findIndex} from 'lodash';
import moment from 'moment';


/**
 * Clears the items list of the featured planning items.
 * @return Dispatch object
 */
const clearList = () => ({type: FEATURED_PLANNING.ACTIONS.CLEAR_LIST});


/**
 * Stores current search request params to the store
 * param {object} params - Search parameters
 * @return Dispatch object
 */
const requestFeaturedPlannings = (params) => ({
    type: FEATURED_PLANNING.ACTIONS.REQUEST,
    payload: params,
});


/**
 * Saves the total count of search items of the current request.
 * param {integer} total - Total count number of items returned from backend
 * @return Dispatch object
 */
const total = (total) => ({
    type: FEATURED_PLANNING.ACTIONS.TOTAL,
    payload: total,
});


/**
 * Stores the flag in store notifying that feature planning modal is open
 * @return Dispatch object
 */
const setFeaturePlanningInUse = () => ({type: FEATURED_PLANNING.ACTIONS.IN_USE});


/**
 * Sets the features planning items to be displayed in list
 * param {array} ids - array of featured planning items ids
 * @return Dispatch object
 */
const setInList = (ids) => ({
    type: FEATURED_PLANNING.ACTIONS.SET_LIST,
    payload: ids,
});


/**
 * Concatenates planning item ids to existing list
 * @param {object} ids - array of featured planning items ids
 * @return Dispatch object
 */
const addToList = (ids) => ({
    type: FEATURED_PLANNING.ACTIONS.ADD_TO_LIST,
    payload: ids,
});


/**
 * Saves unsaved data from modal to store
 * @param {object} ids - array of featured planning items in the record for that day
 * @return Dispatch object
 */
const saveDirtyData = (ids) => (
    {
        type: FEATURED_PLANNING.ACTIONS.UNSAVED_ITEMS,
        payload: ids,
    }
);


/**
 * Updates featured planning items returned from store and sets / appends the list
 * @param {array} plannings - array of featured planning items
 * @param {boolean} append - if true add to list else set the entire list
 * @return Promise
 */
const receivePlannings = (plannings, append = false) => (
    (dispatch) => {
        dispatch({
            type: FEATURED_PLANNING.ACTIONS.RECEIVE_PLANNINGS,
            payload: plannings,
        });

        if (append) {
            dispatch(self.addToList(plannings.map((p) => p._id)));
        } else {
            dispatch(self.setInList(plannings.map((p) => p._id)));
        }
        return Promise.resolve();
    }
);


/**
 * Forms search parameters and issues requests to find and update featured planning items
 * and the featured stories record for a given date
 * @param {object} date - moment date object to load the data for
 * @return Promise
 */
const loadFeaturedPlanningsData = (date) => (
    (dispatch) => {
        let startDate = moment(date || moment()), endDate = moment(date || moment());

        startDate.set({
            hour: 0,
            minute: 0,
            second: 0,
        });
        endDate.set({
            hour: 23,
            minute: 59,
            second: 0,
        });

        const params = {
            advancedSearch: {
                dates: {
                    start: startDate,
                    end: endDate,
                },
                featured: true,
            },
            page: 1,
            spikeState: SPIKED_STATE.NOT_SPIKED,
        };

        dispatch({type: FEATURED_PLANNING.ACTIONS.LOADING_START});
        dispatch(self.requestFeaturedPlannings(params));
        return dispatch(self.getFeaturedPlanningItem(startDate))
            .finally(() => dispatch(self.fetchToList(params)))
            .finally(() => dispatch({type: FEATURED_PLANNING.ACTIONS.LOADING_COMPLETE}));
    }
);

/**
 * Requests api to find the featured stories for a given date
 * and updates the store
 * @param {object} date - moment date object to load the data for
 * @return Promise
 */
const getFeaturedPlanningItem = (date) => (
    (dispatch) => (
        dispatch(planningApi.fetchFeaturedPlanningItemById(getIdForFeauturedPlanning(date)))
            .then((item) => {
                dispatch({
                    type: FEATURED_PLANNING.ACTIONS.RECEIVE_FEATURED_PLANNING_ITEM,
                    payload: item,
                });
                return Promise.resolve(item);
            }
            ))
);


/**
 * Recursively requests backend to query and fetch the featured planning items
 * until the total number of items are received
 * @param {object} params - search parameters for the request
 * @param {boolean} append - if true updates list else sets entire list
 * @return Promise
 */
const fetchToList = (params = {}, append = false) => (
    (dispatch, getState) => {
        const currentItemCount = Object.keys(selectors.featuredPlanning.storedPlannings(getState())).length;

        dispatch(self.requestFeaturedPlannings(params));
        return dispatch(planningApi.query(params))
            .then((data) => {
                dispatch(self.total(data.total));
                dispatch(self.receivePlannings(data._items, append));
                if (data.total > currentItemCount + data._items.length) {
                    params.page += 1;
                    return dispatch(self.fetchToList(params, true));
                }

                return Promise.resolve();
            });
    }
);


/**
 * Checks the locks restrictions and opens the featured stories modal
 * @return Promise
 */
const openFeaturedPlanningModal = () => (
    (dispatch, getState, {notify}) => {
        const lockSession = selectors.featuredPlanning.featureLockSession(getState());
        const currentSession = selectors.general.sessionId(getState());


        if (lockSession && lockSession !== currentSession) {
            return dispatch(showModal({modalType: MODALS.UNLOCK_FEATURED_STORIES}));
        }

        return dispatch(planningApi.lockFeaturedPlanning())
            .then(() => {
                dispatch(self.setFeaturePlanningInUse());
                dispatch(showModal({modalType: MODALS.FEATURED_STORIES}));
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to lock featured story action!'))
                );
            });
    }
);


/**
 * Checks if ignore-can-save is needed before toggleing 'featured' attribute of a planning item
 * @param {item} params - planning item to modify
 * @param {boolean} remove - if true removes the featured attribute else sets it
 * @return Promise
 */
const modifyPlanningFeatured = (item, remove = false) => (
    (dispatch) => (
        dispatch(main.openActionModalFromEditor(
            item,
            gettext('Save changes before adding to top stories ?'),
            (unlockedItem, previousLock, openInEditor, openInModal) => (
                dispatch(self._modifyPlanningFeatured(unlockedItem, remove))
                    .then((updatedItem) => {
                        if (get(previousLock, 'action')) {
                            return dispatch(locks.lock(updatedItem, previousLock.action));
                        }
                    })
            )
        ))
    )
);


/**
 * Toggles 'featured' attribute of a planning item
 * @param {item} params - planning item to modify
 * @param {boolean} remove - if true removes the featured attribute else sets it
 * @return Promise
 */
const _modifyPlanningFeatured = (item, remove = false) => (
    (dispatch, getState, {api, notify}) => (
        dispatch(locks.lock(item, remove ? 'remove_featured' : 'add_featured'))
            .then((lockedItem) => {
                lockedItem.featured = !remove;
                return dispatch(planningUi.saveAndUnlockPlanning(lockedItem)).then((updatedItem) => {
                    remove ? notify.success(gettext('Planning item removed as featured story')) :
                        notify.success(gettext('Planning item added as featured story'));
                    return Promise.resolve(updatedItem);
                }, (error) => {
                    remove ? notify.error(gettext('Failed to remove planning item as featured story')) :
                        notify.error(gettext('Failed to add planning item added as featured story'));
                    return Promise.reject(error);
                });
            })
    )
);


/**
 * Saves featured stories record for a givendate
 * @param {item} params - record to save
 * @return Promise
 */
const saveFeaturedPlanningForDate = (item) => (
    (dispatch, getState, {notify}) => (dispatch(planningApi.saveFeaturedPlanning(item))
        .then((item) => {
            if (get(item, ' posted')) {
                notify.success(gettext('Posted Featured Stories record'));
            } else {
                notify.success(gettext('Saved Featured Stories record'));
            }

            dispatch({
                type: FEATURED_PLANNING.ACTIONS.RECEIVE_FEATURED_PLANNING_ITEM,
                payload: item,
            });
        },
        (error) => {
            notify.error(
                getErrorMessage(error, gettext('Failed to save featured story record!'))
            );
        })
    )
);

/**
 * Notifies that the featured planning modal is now closed by unlocking and closing modal
 * @return Promise
 */
const unsetFeaturePlanningInUse = (unlock = true) => (
    (dispatch) => {
        dispatch({type: FEATURED_PLANNING.ACTIONS.COMPLETE});
        if (unlock) {
            return dispatch(planningApi.unlockFeaturedPlanning())
                .then(() => {
                    dispatch(hideModal());
                    return Promise.resolve();
                });
        }

        return Promise.resolve();
    }
);


/**
 * Adds or removes featured planning item based on websocket notification
 * when a planning item was updated
 * @param {interger} planningId - ID of the eplannig item that was updated
 * @return Promise
 */
const onPlanningUpdatedNotification = (planningId) => (
    (dispatch, getState) => {
        if (!selectors.featuredPlanning.inUse(getState())) {
            return Promise.resolve();
        }

        return dispatch(planningApi.fetchById(planningId, {force: true}))
            .then((item) => {
                const currentSearchDate = selectors.featuredPlanning.currentSearchDate(getState());
                const currentFeaturedPlannings = selectors.featuredPlanning.storedPlannings(getState());
                const planningsForDate = get(planningUtils.getPlanningByDate([item], null,
                    moment(currentSearchDate).set({hour: 0, minute: 0}),
                    moment(currentSearchDate).set({hour: 23, minute: 59})), '[0].events', [])
                    .map((p) => p._id);

                if (!(planningId in currentFeaturedPlannings) && !planningsForDate.includes(planningId)) {
                    return Promise.resolve();
                }

                if ((planningId in currentFeaturedPlannings && !planningsForDate.includes(planningId)) ||
                    (!item.featured && currentFeaturedPlannings[planningId].featured)) {
                    // Removed from the date
                    dispatch(removePlanningItemFromSelection(planningId));
                    return Promise.resolve();
                }

                // Added to date or item attribute updated
                if (item.featured) {
                    return dispatch(self.addPlanningItemToSelection(planningId, item));
                }

                return Promise.resolve();
            });
    }
);


/**
 * Dispatch to remove planning item from featured planning list
 * @param {interger} planningId - ID of the eplannig item that should beremoved
 * @return Dispatch object
 */
const removePlanningItemFromSelection = (planningId) => ({
    type: FEATURED_PLANNING.ACTIONS.REMOVE_PLANNING,
    payload: planningId,
});


/**
 * Adds featured planning to the featured planning list if required by fetching it by ID
 * @param {interger} id - ID of the eplannig item that was updated
 * @param {object} item - full item object if available to add
 * @return Promise
 */
const addPlanningItemToSelection = (id, item = null) => (
    (dispatch, getState) => {
        let promise = Promise.resolve(item);

        if (!item) {
            promise = dispatch(planningApi.fetchById(id, {force: true}));
        }

        return promise.then((item) => {
            let planningsToUpdate = Object.values(selectors.featuredPlanning.storedPlannings(getState()));
            const index = findIndex(planningsToUpdate, (p) => p._id === item._id);

            if (index >= 0) {
                planningsToUpdate[index] = item;
            } else {
                planningsToUpdate.push(item);
            }

            return dispatch(self.receivePlannings(planningsToUpdate, true));
        });
    }
);

const forceUnlock = () => (
    (dispatch, getState) => (
        dispatch(planningApi.unlockFeaturedPlanning())
            .then(() => {
                dispatch(self.openFeaturedPlanningModal());
            })
    )
);

// eslint-disable-next-line consistent-this
const self = {
    clearList,
    receivePlannings,
    fetchToList,
    requestFeaturedPlannings,
    setInList,
    addToList,
    _modifyPlanningFeatured,
    modifyPlanningFeatured,
    openFeaturedPlanningModal,
    setFeaturePlanningInUse,
    unsetFeaturePlanningInUse,
    loadFeaturedPlanningsData,
    saveFeaturedPlanningForDate,
    getFeaturedPlanningItem,
    total,
    saveDirtyData,
    onPlanningUpdatedNotification,
    removePlanningItemFromSelection,
    addPlanningItemToSelection,
    forceUnlock,
};

export default self;
