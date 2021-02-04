import {get, findIndex, cloneDeep} from 'lodash';
import moment from 'moment';
import momentTz from 'moment-timezone';

import {appConfig} from 'appConfig';
import {ISearchParams, IFeaturedPlanningItem} from '../../interfaces';
import {planningApi as planningApis} from '../../superdeskApi';

import {showModal, hideModal} from '../index';
import planningApi from './api';
import {locks} from '../index';
import main from '../main';

import {
    getErrorMessage,
    gettext,
    getIdForFeauturedPlanning,
    planningUtils,
    getTimeZoneOffset,
} from '../../utils';

import * as selectors from '../../selectors';
import {MODALS, FEATURED_PLANNING, SPIKED_STATE, MAIN, TIME_COMPARISON_GRANULARITY} from '../../constants';


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
function requestFeaturedPlannings(params: ISearchParams) {
    return {
        type: FEATURED_PLANNING.ACTIONS.REQUEST,
        payload: params,
    };
}


/**
 * Saves the total count of search items of the current request.
 * param {integer} total - Total count number of items returned from backend
 * @return Dispatch object
 */
function total(total: number) {
    return {
        type: FEATURED_PLANNING.ACTIONS.TOTAL,
        payload: total,
    };
}


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
function loadFeaturedPlanningsData(date) {
    return (dispatch, getState, {notify}) => {
        let startDate = momentTz.tz(date ? date : moment(), appConfig.defaultTimezone);
        const params: ISearchParams = {
            featured: true,
            start_date: startDate,
            date_filter: 'for_date',
            only_future: false,
            spike_state: 'draft',
            exclude_rescheduled_and_cancelled: true,
            include_scheduled_updates: true,
            tz_offset: getTimeZoneOffset(
                momentTz.tz(startDate, appConfig.defaultTimezone)
            ),
        };

        dispatch({type: FEATURED_PLANNING.ACTIONS.LOADING_START});
        return dispatch(self.getFeaturedPlanningItem(startDate))
            .then(
                (featuredItem) => dispatch(self.fetchToList(params, featuredItem)),
                (error) => {
                    if (error._error?.code === 404) {
                        return dispatch(self.fetchToList(params));
                    }

                    notify.error(
                        getErrorMessage(error, gettext('Failed to fetch featured stories!'))
                    );

                    return Promise.reject(error);
                }
            )
            .finally(() => dispatch({type: FEATURED_PLANNING.ACTIONS.LOADING_COMPLETE}));
    };
}

/**
 * Requests api to find the featured stories for a given date
 * and updates the store
 * @param {object} date - moment date object to load the data for
 * @return Promise
 */
function getFeaturedPlanningItem(date) {
    return (dispatch) => (
        planningApis.planning.featured.getByDate(date)
            .then((item) => {
                dispatch({
                    type: FEATURED_PLANNING.ACTIONS.RECEIVE_FEATURED_PLANNING_ITEM,
                    payload: item,
                });
                return Promise.resolve(item);
            })
    );
}


/**
 * Recursively requests backend to query and fetch the featured planning items
 * until the total number of items are received
 * @param {object} params - search parameters for the request
 * @param {Object} featuredItem - The featured planning item to load items for
 * @return Promise
 */
function fetchToList(params: ISearchParams = {}, featuredItem: IFeaturedPlanningItem = null) {
    return (dispatch) => {
        dispatch(self.requestFeaturedPlannings(params));

        return planningApis.planning.searchGetAll(params)
            .then((planningItems) => {
                dispatch(self.total(planningItems.length));
                dispatch(self.receivePlannings(planningItems, false));

                const planIds = planningItems.map(
                    (item) => item._id
                );
                const itemIds = (featuredItem?.items ?? [])
                    .filter((itemId) => (
                        !planIds.includes(itemId)
                    ));

                if (itemIds.length > 0) {
                    return planningApis.planning.getByIds(itemIds)
                        .then((items) => {
                            dispatch({
                                type: FEATURED_PLANNING.ACTIONS.SET_REMOVE_LIST,
                                payload: items,
                            });
                        });
                }

                return Promise.resolve();
            });
    };
}


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
const modifyPlanningFeatured = (original, remove = false) => (
    (dispatch) => {
        dispatch(main.openActionModalFromEditor(
            original,
            gettext('Save changes before adding to top stories ?'),
            (unlockedItem, previousLock, openInEditor, openInModal) => (
                dispatch(self._modifyPlanningFeatured(unlockedItem, remove))
                    .then((updatedItem) => {
                        if (get(previousLock, 'action')) {
                            dispatch(locks.lock(updatedItem, previousLock.action)).then((updatedItem) => {
                                if (openInEditor || openInModal) {
                                    dispatch(main.openForEdit(updatedItem, !openInModal, openInModal));
                                }
                            }
                            );
                        }
                    })
            )
        ));
    }
);


/**
 * Toggles 'featured' attribute of a planning item
 * @param {Object} item - planning item to modify
 * @param {boolean} remove - if true removes the featured attribute else sets it
 * @return Promise
 */
const _modifyPlanningFeatured = (item, remove = false) => (
    (dispatch, getState, {api, notify}) => (
        dispatch(locks.lock(item, remove ? 'remove_featured' : 'add_featured'))
            .then((original) => {
                const updates = cloneDeep(original);

                updates.featured = !remove;
                return dispatch(main.saveAndUnlockItem(original, updates))
                    .then((updatedItem) => {
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
 * @param {Object} item - record to save
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

            dispatch({
                type: FEATURED_PLANNING.ACTIONS.SET_REMOVE_LIST,
                payload: [],
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
                    momentTz.tz(moment(currentSearchDate.format('YYYY-MM-DD')), appConfig.defaultTimezone),
                    momentTz.tz(moment(currentSearchDate).set({
                        [TIME_COMPARISON_GRANULARITY.HOUR]: 23,
                        [TIME_COMPARISON_GRANULARITY.MINUTE]: 59,
                        [TIME_COMPARISON_GRANULARITY.SECOND]: 0,
                        [TIME_COMPARISON_GRANULARITY.MILLISECOND]: 0,
                    }), appConfig.defaultTimezone),
                    appConfig.defaultTimezone),
                '[0].events', []).map((p) => p._id);

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
