import moment from 'moment-timezone';
import {cloneDeep, some} from 'lodash';

import {appConfig} from 'appConfig';
import {IUser} from 'superdesk-api';
import {IFeaturedPlanningItem, IFeaturedPlanningSaveItem, IPlanningItem, ISearchParams} from '../../interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';
import main from '../main';

import {MODALS, FEATURED_PLANNING, TIME_COMPARISON_GRANULARITY} from '../../constants';
import {getTimeZoneOffset, getErrorMessage, planningUtils, isExistingItem, isItemPublic} from '../../utils';
import * as selectors from '../../selectors';
import {showModal, hideModal} from '../';


function setInUse(inUse: boolean) {
    return {
        type: FEATURED_PLANNING.ACTIONS.SET_IN_USE,
        payload: inUse,
    };
}

function setLoading(loading: boolean) {
    return {
        type: FEATURED_PLANNING.ACTIONS.SET_LOADING,
        payload: loading,
    };
}

function setCurrentSearchParams(params: ISearchParams) {
    return {
        type: FEATURED_PLANNING.ACTIONS.SET_CURRENT_SEARCH_PARAMS,
        payload: params,
    };
}

function setLockUser(user: IUser['_id'], session: string) {
    return {
        type: FEATURED_PLANNING.ACTIONS.SET_LOCK_USER,
        payload: {
            user: user,
            session: session,
        },
    };
}

function setUnlocked() {
    return {
        type: FEATURED_PLANNING.ACTIONS.SET_LOCK_USER,
        payload: {
            user: null,
            session: null,
        },
    };
}

function setFeaturedPlanningItem(item: IFeaturedPlanningItem) {
    return {
        type: FEATURED_PLANNING.ACTIONS.SET_FEATURED_PLANNING_ITEM,
        payload: item,
    };
}

function clearFeaturedNotifications() {
    return {type: FEATURED_PLANNING.ACTIONS.CLEAR_NOTIFICATIONS};
}

function removeHighlightForItem(item: IPlanningItem) {
    return {
        type: FEATURED_PLANNING.ACTIONS.REMOVE_HIGHLIGHT,
        payload: item._id,
    };
}

function updateListGroupItemIds() {
    return {type: FEATURED_PLANNING.ACTIONS.UPDATE_LIST_IDS};
}

function storePlanningItems(planningItems: Array<IPlanningItem>) {
    return {
        type: FEATURED_PLANNING.ACTIONS.STORE_PLANNING_ITEMS,
        payload: planningItems.reduce(
            (items, item) => {
                items[item._id] = item;

                return items;
            },
            {}
        ),
    };
}

function clearLists() {
    return {type: FEATURED_PLANNING.ACTIONS.CLEAR_LISTS};
}

function setAvailableItems(planningItems: Array<IPlanningItem['_id']>) {
    return {
        type: FEATURED_PLANNING.ACTIONS.SET_AVAILABLE_ITEMS,
        payload: planningItems,
    };
}

function setRemoveList(planningIds: Array<IPlanningItem['_id']>) {
    return {
        type: FEATURED_PLANNING.ACTIONS.SET_REMOVE_LIST,
        payload: planningIds,
    };
}

function updateSelectedList(planningIds: Array<IPlanningItem['_id']>) {
    return {
        type: FEATURED_PLANNING.ACTIONS.UPDATE_SELECTED_LIST_ORDER,
        payload: planningIds,
    };
}

function movePlanningToSelectedList(item: IPlanningItem) {
    return {
        type: FEATURED_PLANNING.ACTIONS.MOVE_ITEM_TO_SELECTED,
        payload: item._id,
    };
}

function movePlanningToUnselectedList(item: IPlanningItem) {
    return {
        type: FEATURED_PLANNING.ACTIONS.MOVE_ITEM_TO_UNSELECTED,
        payload: item._id,
    };
}

function getAndUpdateStoredPlanningItem(itemId: IPlanningItem['_id']) {
    return (dispatch, getState) => {
        if (selectors.featuredPlanning.inUse(getState())) {
            return planningApi.planning.getById(itemId, false, true).then((item) => {
                dispatch({
                    type: FEATURED_PLANNING.ACTIONS.UPDATE_PLANNING_AND_LISTS,
                    payload: item,
                });
            });
        }

        return Promise.resolve();
    };
}

function updatePlanningMetadata(itemId: IPlanningItem['_id']) {
    return (dispatch, getState) => {
        if (selectors.featuredPlanning.inUse(getState())) {
            planningApi.planning.getById(itemId, false, true).then((item) => {
                dispatch({
                    type: FEATURED_PLANNING.ACTIONS.UPDATE_PLANNING_METADATA,
                    payload: item,
                });
            });
        }
    };
}

function getFeaturedPlanningItem(date: moment.Moment) {
    return (dispatch) => (
        planningApi.planning.featured.getByDate(date)
            .then((item) => {
                dispatch(setFeaturedPlanningItem(item));

                return item;
            })
    );
}

function fetchToList(params: ISearchParams = {}, featuredItem?: IFeaturedPlanningItem) {
    return (dispatch, getState) => {
        dispatch(setCurrentSearchParams(params));

        return (featuredItem?.items?.length ?
            planningApi.planning.getByIds(featuredItem?.items, 'both', {include_killed: true}) :
            Promise.resolve<Array<IPlanningItem>>([])
        ).then((currentFeaturedItems) => (
            planningApi.planning.searchGetAll(params)
                .then((searchResults) => ({
                    current: currentFeaturedItems,
                    search: searchResults,
                }))
        )).then((items) => {
            const currentIds = items.current.map((item) => item._id);
            const searchResultIds = items.search.map((item) => item._id);
            const allPlanningItems = [
                ...items.current.filter((item) => !searchResultIds.includes(item._id)),
                ...items.search,
            ];

            const autoRemoveIds = currentIds.filter((itemId) => !searchResultIds.includes(itemId));

            dispatch(storePlanningItems(allPlanningItems));

            const currentSearchDate = selectors.featuredPlanning.currentSearchDate(getState());
            const sortedItemsForDate = planningUtils.getFeaturedPlanningItemsForDate(
                items.search,
                currentSearchDate
            );
            const sortedItemIdsForDate = sortedItemsForDate
                .filter((item) => !autoRemoveIds.includes(item._id))
                .map((item) => item._id);

            dispatch(setAvailableItems(sortedItemIdsForDate));
            dispatch(setRemoveList(autoRemoveIds));
            dispatch(updateListGroupItemIds());
            return Promise.resolve();
        });
    };
}

function loadFeaturedPlanningsData(date?: moment.Moment) {
    return (dispatch) => {
        dispatch(setLoading(true));
        dispatch(clearLists());
        const startDate = moment.tz(date ? date : moment(), appConfig.default_timezone);
        const params: ISearchParams = {
            featured: true,
            start_date: startDate,
            date_filter: 'for_date',
            only_future: false,
            spike_state: 'draft',
            include_killed: false,
            exclude_rescheduled_and_cancelled: true,
            include_scheduled_updates: true,
            tz_offset: getTimeZoneOffset(moment.tz(startDate, appConfig.default_timezone)),
        };

        return dispatch(getFeaturedPlanningItem(startDate))
            .then(
                (featuredItem) => dispatch(fetchToList(params, featuredItem)),
                (error) => {
                    if (error._error?.code === 404) {
                        return dispatch(fetchToList(params));
                    }

                    const {gettext} = superdeskApi.localization;
                    const {notify} = superdeskApi.ui;

                    notify.error(
                        getErrorMessage(error, gettext('Failed to fetch featured stories!'))
                    );

                    return Promise.reject(error);
                }
            )
            .finally(() => {
                dispatch(setLoading(false));
            });
    };
}

function openFeaturedPlanningModal() {
    return (dispatch, getState) => {
        const state = getState();
        const lockSession = selectors.featuredPlanning.featureLockSession(state);
        const currentSession = selectors.general.sessionId(state);

        if (lockSession && lockSession !== currentSession) {
            return dispatch(showModal({modalType: MODALS.UNLOCK_FEATURED_STORIES}));
        }

        const currentSearchDate = selectors.featuredPlanning.currentSearchDate(state);

        dispatch(setInUse(true));
        dispatch(showModal({modalType: MODALS.FEATURED_STORIES}));
        planningApi.locks.lockFeaturedPlanning()
            .then(() => (
                dispatch(loadFeaturedPlanningsData(currentSearchDate))
            ))
            .catch((error) => {
                const {gettext} = superdeskApi.localization;
                const {notify} = superdeskApi.ui;

                notify.error(
                    getErrorMessage(error, gettext('Failed to lock featured story action!'))
                );
            });
    };
}

function modifyPlanningFeatured(original: IPlanningItem, remove: boolean = false) {
    return (dispatch) => {
        const {gettext} = superdeskApi.localization;

        dispatch(main.openActionModalFromEditor(
            original,
            gettext('Save changes before adding to top stories?'),
            (unlockedItem, previousLock, openInEditor, openInModal) => (
                dispatch(_modifyPlanningFeatured(unlockedItem, remove))
                    .then((updatedItem) => {
                        if (previousLock?.action) {
                            planningApi.locks.lockItem(updatedItem, previousLock.action)
                                .then((updatedUnlockedItem) => {
                                    if (openInEditor || openInModal) {
                                        dispatch(main.openForEdit(updatedUnlockedItem, !openInModal, openInModal));
                                    }
                                });
                        }
                    })
            )
        ));
    };
}

function _modifyPlanningFeatured(item: IPlanningItem, remove: boolean = false) {
    return (dispatch) => (
        planningApi.locks.lockItem(item, remove ? 'remove_featured' : 'add_featured')
            .then((original: IPlanningItem) => {
                const updates = cloneDeep(original);
                const {gettext} = superdeskApi.localization;
                const {notify} = superdeskApi.ui;

                updates.featured = !remove;
                return dispatch(main.saveAndUnlockItem(original, updates))
                    .then(
                        (updatedItem) => {
                            remove ?
                                notify.success(gettext('Planning item removed as featured story')) :
                                notify.success(gettext('Planning item added as featured story'));

                            return updatedItem;
                        },
                        (error) => {
                            remove ?
                                notify.error(gettext('Failed to remove planning item as featured story')) :
                                notify.error(gettext('Failed to add planning item added as featured story'));

                            return Promise.reject(error);
                        }
                    );
            })
    );
}

function saveFeaturedPlanningForDate(updates: Partial<IFeaturedPlanningItem>, reloadFeaturedItem: boolean) {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return (dispatch, getState) => (
        planningApi.planning.featured.save(updates)
            .then(
                (item: IFeaturedPlanningItem) => {
                    if (item.posted) {
                        notify.success(gettext('Posted Featured Stories record'));
                    } else {
                        notify.success(gettext('Saved Featured Stories record'));
                    }

                    if (reloadFeaturedItem) {
                        dispatch(loadFeaturedPlanningsData(selectors.featuredPlanning.currentSearchDate(getState())));
                    }
                },
                (error) => {
                    notify.error(
                        getErrorMessage(error, gettext('Failed to save featured story record!'))
                    );
                }
            )
    );
}

function unsetFeaturePlanningInUse(unlock: boolean = true) {
    return (dispatch) => {
        dispatch(setInUse(false));

        if (unlock) {
            planningApi.locks.unlockFeaturedPlanning()
                .then(() => {
                    dispatch(hideModal());
                    return Promise.resolve();
                });
        }

        return Promise.resolve();
    };
}

function forceUnlock() {
    return (dispatch) => (
        planningApi.locks.unlockFeaturedPlanning()
            .then(() => (
                // Set unlocked here so the websocket notification doesn't think
                // the current session is getting unlocked by another user/session
                dispatch(self.openFeaturedPlanningModal())
            ))
    );
}

function saveFeaturedStory(teardown: boolean) {
    return (dispatch, getState) => {
        const state = getState();
        const featuredItem = selectors.featuredPlanning.featuredPlanningItem(state);

        if (featuredItem?.posted) {
            const {gettext} = superdeskApi.localization;

            dispatch(showModal({
                modalType: MODALS.IGNORE_CANCEL_SAVE,
                modalProps: {
                    bodyText: gettext('Save changes without re-posting?'),
                    onSave: () => {
                        dispatch(_save(teardown));
                    },
                    onIgnore: () => {
                        dispatch(unsetFeaturePlanningInUse());
                    },
                    autoClose: true,
                    showIgnore: teardown,
                },
            }));
        } else {
            dispatch(_save(teardown));
        }
    };
}

function _save(teardown: boolean) {
    return (dispatch, getState) => {
        const state = getState();
        const featuredItem = selectors.featuredPlanning.featuredPlanningItem(state);
        const removeIds = selectors.featuredPlanning.autoRemovedPlanningIds(state);
        const selectedIds = selectors.featuredPlanning.selectedPlanningIds(state);
        const currentSearchDate = selectors.featuredPlanning.currentSearchDate(state);

        const updates: IFeaturedPlanningSaveItem = {
            items: selectedIds.filter(
                (itemId) => !removeIds.includes(itemId)
            ),
            tz: currentSearchDate.tz(),
        };

        if (!isExistingItem(featuredItem)) {
            updates.date = currentSearchDate.clone();
            updates.date.set({
                [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
                [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
            });
        }

        dispatch(saveFeaturedPlanningForDate(updates, !teardown))
            .then(() => {
                if (teardown) {
                    dispatch(unsetFeaturePlanningInUse());
                }
            });
    };
}

function postFeaturedStory() {
    return (dispatch, getState) => {
        const state = getState();
        const selectedPlanningItems = selectors.featuredPlanning.selectedPlanningItems(state);

        if (some(selectedPlanningItems, (item) => !(isItemPublic(item)))) {
            const {gettext} = superdeskApi.localization;
            const errorMsg = gettext(
                'Some selected items have not yet been posted. All selections must be visible to subscribers.'
            );

            dispatch(main.notifyValidationErrors([errorMsg]));
            return;
        }

        const featuredItem = selectors.featuredPlanning.featuredPlanningItem(state);
        const removeIds = selectors.featuredPlanning.autoRemovedPlanningIds(state);
        const selectedIds = selectors.featuredPlanning.selectedPlanningIds(state);
        const currentSearchDate = selectors.featuredPlanning.currentSearchDate(state);
        const updates: IFeaturedPlanningSaveItem = {
            items: selectedIds.filter(
                (itemId) => !removeIds.includes(itemId)
            ),
            tz: currentSearchDate.tz(),
            posted: true,
        };

        if (!isExistingItem(featuredItem)) {
            updates.date = currentSearchDate.clone();
            updates.date.set({
                [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
                [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
            });
        }

        dispatch(saveFeaturedPlanningForDate(updates, true));
    };
}

function closeFeaturedStoriesModal() {
    return (dispatch, getState) => {
        if (!selectors.featuredPlanning.isDirty(getState())) {
            dispatch(unsetFeaturePlanningInUse());
        } else {
            const {gettext} = superdeskApi.localization;

            dispatch(showModal({
                modalType: MODALS.IGNORE_CANCEL_SAVE,
                modalProps: {
                    bodyText: gettext(
                        'There are unsaved changes. Are you sure you want to exit Manging Featured Stories?'
                    ),
                    onIgnore: () => {
                        dispatch(unsetFeaturePlanningInUse());
                    },
                    onSave: () => {
                        // Use `setTimeout` otherwise the second `IgnoreCancelSave` modal will not show
                        // If the FeaturedStory has been posted
                        setTimeout(() => {
                            dispatch(saveFeaturedStory(true));
                        });
                    },
                    autoClose: true,
                },
            }));
        }
    };
}

// eslint-disable-next-line consistent-this
const self = {
    setLockUser,
    setUnlocked,
    clearFeaturedNotifications,
    removeHighlightForItem,
    updateSelectedList,
    movePlanningToSelectedList,
    movePlanningToUnselectedList,
    getAndUpdateStoredPlanningItem,
    updatePlanningMetadata,
    loadFeaturedPlanningsData,
    openFeaturedPlanningModal,
    modifyPlanningFeatured,
    unsetFeaturePlanningInUse,
    forceUnlock,
    saveFeaturedStory,
    postFeaturedStory,
    closeFeaturedStoriesModal,
};

export default self;
