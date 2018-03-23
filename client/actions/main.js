import {MAIN, ITEM_TYPE} from '../constants';
import {activeFilter, lastRequestParams} from '../selectors/main';
import planningUi from './planning/ui';
import planningApi from './planning/api';
import eventsUi from './events/ui';
import eventsApi from './events/api';
import {locks, showModal} from './';
import {selectAgenda, fetchSelectedAgendaPlannings} from './agenda';
import {
    getErrorMessage,
    notifyError,
    getItemType,
    gettext,
    eventUtils,
    shouldLockItemForEdit,
    shouldUnLockItem,
    getItemTypeString,
} from '../utils';
import {MODALS, WORKSPACE} from '../constants';
import eventsPlanningUi from './eventsPlanning/ui';
import {get, omit, isEmpty, isNil} from 'lodash';
import {lockUtils} from '../utils';

import * as selectors from '../selectors';

const lockAndEdit = (item) => (
    (dispatch, getState, {notify}) => {
        const currentItemId = selectors.forms.currentItemId(getState());
        const currentSession = selectors.general.session(getState());
        const lockedItems = selectors.locks.getLockedItems(getState());
        const shouldLockItem = shouldLockItemForEdit(item, lockedItems);

        // If this item is already opened and we either have a lock or the item should not get locked
        // Then simply return the item
        if (currentItemId === item._id &&
            (!shouldLockItem || lockUtils.isItemLockedInThisSession(item, currentSession))
        ) {
            return Promise.resolve(item);
        }

        dispatch({type: MAIN.ACTIONS.EDIT_LOADING_START});
        dispatch(self.openEditor(item));

        // If the item being edited is currently opened in the Preview panel
        // then close the preview panel
        if (selectors.main.previewId(getState()) === item._id) {
            dispatch(self.closePreview());
        }

        // If it is an existing item and the item is not locked
        // then lock the item, otherwise return the existing item
        const promise = shouldLockItem ?
            dispatch(locks.lock(item)) :
            Promise.resolve(item);

        return promise.then((lockedItem) => {
            dispatch({type: MAIN.ACTIONS.EDIT_LOADING_COMPLETE});

            return Promise.resolve(lockedItem);
        }, (error) => {
            notify.error(
                getErrorMessage(error, gettext('Failed to lock the item'))
            );

            dispatch({type: MAIN.ACTIONS.EDIT_LOADING_COMPLETE});

            return Promise.reject(error);
        });
    }
);

const unlockAndCancel = (item) => (
    (dispatch, getState) => {
        const state = getState();

        // If the item exists and is locked in this session
        // then unlock the item
        if (shouldUnLockItem(item,
            selectors.getSessionDetails(state),
            selectors.general.currentWorkspace(state))) {
            dispatch(locks.unlock(item));
        } else if (get(item, '_planning_item')) {
            dispatch(planningApi.unlock({_id: item._planning_item}));
        }

        dispatch(self.closeEditor());
        return Promise.resolve();
    }
);

const unlockAndCloseEditor = (item) => (
    (dispatch, getState) => {
        const currentEditId = selectors.forms.currentItemId(getState());

        if (item) {
            dispatch(locks.unlock(item));
            if (currentEditId === get(item, '_id')) {
                dispatch(self.closeEditor());
            }
        }
    }
);

const save = (item, withConfirmation = true) => (
    (dispatch, getState, {notify}) => {
        const itemType = getItemType(item);
        let promise;
        let confirmation = withConfirmation;

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            confirmation = withConfirmation && get(item, 'recurrence_id');
            promise = dispatch(confirmation ?
                eventsUi.saveWithConfirmation(item) :
                eventsApi.save(item)
            );
            break;
        case ITEM_TYPE.PLANNING:
            confirmation = false;
            promise = dispatch(planningUi.save(item));
            break;
        default:
            promise = Promise.reject(
                gettext('Failed to save, could not find the item {{itemType}}!', {itemType: itemType})
            );
            break;
        }

        return promise
            .then((savedItems) => {
                const savedItem = Array.isArray(savedItems) ? savedItems[0] : savedItems;

                if (!get(item, '_id') && selectors.getCurrentWorkspace(getState()) !== WORKSPACE.AUTHORING) {
                    notify.success(
                        gettext('{{ itemType }} created', {itemType: getItemTypeString(item)})
                    );
                    return dispatch(self.lockAndEdit(savedItem));
                }

                if (!confirmation) {
                    notify.success(
                        gettext('The {{ itemType }} has been saved', {itemType: getItemTypeString(item)})
                    );
                }

                return Promise.resolve(savedItem);
            }, (error) => {
                notifyError(
                    notify,
                    error,
                    gettext('Failed to save the {{ itemType }}', {itemType: getItemTypeString(item)})
                );

                return Promise.reject(error);
            });
    }
);

const unpublish = (item, withConfirmation = true) => (
    (dispatch, getState, {notify}) => {
        const itemType = getItemType(item);
        let promise;
        let confirmation = withConfirmation;

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            confirmation = withConfirmation && get(item, 'recurrence_id');
            promise = dispatch(confirmation ?
                eventsUi.publishWithConfirmation(item, false) :
                eventsApi.unpublish(item)
            );
            break;
        case ITEM_TYPE.PLANNING:
            confirmation = false;
            promise = dispatch(planningApi.unpublish(item));
            break;
        default:
            promise = Promise.reject(gettext('Failed to unpublish, could not find the item type!'));
        }

        return promise
            .then(
                (rtn) => {
                    if (!confirmation) {
                        notify.success(
                            gettext('The {{ itemType }} has been unpublished', {itemType: getItemTypeString(item)})
                        );
                    }
                    return Promise.resolve(rtn);
                },
                (error) => {
                    notifyError(
                        notify,
                        error,
                        gettext('Failed to unpublish the {{ itemType }}', {itemType: getItemTypeString(item)})
                    );
                    return Promise.reject(error);
                }
            );
    }
);

const publish = (item, withConfirmation = true) => (
    (dispatch, getState, {notify}) => {
        const itemType = getItemType(item);
        let promise;
        let confirmation = withConfirmation;

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            confirmation = withConfirmation && get(item, 'recurrence_id');
            promise = dispatch(confirmation ?
                eventsUi.publishWithConfirmation(item, true) :
                eventsApi.publish(item)
            );
            break;
        case ITEM_TYPE.PLANNING:
            confirmation = false;
            promise = dispatch(planningApi.publish(item));
            break;
        default:
            promise = Promise.reject(gettext('Failed to publish, could not find the item type!'));
            break;
        }

        return promise
            .then(
                (rtn) => {
                    if (!confirmation) {
                        notify.success(
                            gettext('The {{ itemType }} has been published', {itemType: getItemTypeString(item)})
                        );
                    }

                    return Promise.resolve(rtn);
                },
                (error) => {
                    notifyError(
                        notify,
                        error,
                        gettext('Failed to publish the {{ itemType }}', {itemType: getItemTypeString(item)})
                    );
                    return Promise.reject(error);
                }
            );
    }
);

const openCancelModal = (item, publish = false) => (
    (dispatch) => {
        const itemType = getItemType(item);

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            dispatch(eventsUi.openCancelModal(item, publish));
            break;
        }
    }
);

const openConfirmationModal = ({title, body, okText, showIgnore, action, ignore}) => (
    (dispatch) => (
        dispatch(showModal({
            modalType: MODALS.CONFIRMATION,
            modalProps: {
                title,
                body,
                okText,
                showIgnore,
                action,
                ignore,
            }
        }))
    )
);

const closePreviewAndEditorForItems = (items, actionMessage = '', field = '_id') => (
    (dispatch, getState, {notify}) => {
        const previewId = selectors.main.previewId(getState());
        const editId = selectors.forms.currentItemId(getState());

        if (previewId && items.find((i) => get(i, field) === previewId)) {
            dispatch(self.closePreview());

            if (actionMessage !== '') {
                notify.warning(actionMessage);
            }
        }

        if (editId && items.find((i) => get(i, field) === editId)) {
            dispatch(self.closeEditor());

            if (actionMessage !== '') {
                notify.warning(actionMessage);
            }
        }

        return Promise.resolve();
    }
);

/**
 * Action to fetch data from events, planning or both.
 * @param {string} ftype - type of filter
  * @return {Object} - returns Promise
 */
const filter = (ftype = null) => (
    (dispatch, getState, {$timeout, $location}) => {
        let filterType = ftype;

        if (filterType === null) {
            filterType = $location.search().filter ||
                activeFilter(getState()) ||
                MAIN.FILTERS.COMBINED;
        }

        dispatch({
            type: MAIN.ACTIONS.FILTER,
            payload: filterType,
        });

        const previousParams = omit(lastRequestParams(getState()) || {}, 'page');
        const searchParams = omit(JSON.parse($location.search().searchParams || '{}'), 'page');
        let params = previousParams;

        if (filterType === $location.search().filter && isEmpty(previousParams)) {
            params = searchParams;
        }

        if (get(params, 'advancedSearch.dates')) {
            params.advancedSearch = eventUtils.convertToMoment(get(params, 'advancedSearch'));
        }

        // Update the url (deep linking)
        $timeout(() => $location.search('filter', filterType));


        return dispatch(self._filter(filterType, params));
    }
);

/**
 * Action to fetch data from events, planning or both.
 * @param {string} filterType - type of filter
 * @param {Object} params - Search params from advanced search
 * @return {Object} - returns Promise
 */
const _filter = (filterType, params = {}) => (
    (dispatch, getState, {$location, notify}) => {
        let promise = Promise.resolve();

        dispatch(self.setUnsetLoadingIndicator(true));
        if (filterType === MAIN.FILTERS.EVENTS) {
            dispatch(eventsPlanningUi.clearList());
            dispatch(planningUi.clearList());

            promise = dispatch(eventsUi.fetchEvents(params));
        } else if (filterType === MAIN.FILTERS.PLANNING) {
            dispatch(eventsPlanningUi.clearList());
            dispatch(eventsUi.clearList());
            const searchAgenda = $location.search().agenda;

            if (searchAgenda) {
                promise = dispatch(selectAgenda(searchAgenda, params));
            } else {
                promise = dispatch(fetchSelectedAgendaPlannings(params));
            }
        } else if (filterType === MAIN.FILTERS.COMBINED) {
            dispatch(eventsUi.clearList());
            dispatch(planningUi.clearList());

            promise = dispatch(eventsPlanningUi.fetch(params));
        }

        return promise
            .then(
                (results) => Promise.resolve(results),
                (error) => {
                    notify.error(gettext('Failed to run the query.'));
                    return Promise.reject(error);
                }
            )
            .finally(() => {
                dispatch(self.setUnsetLoadingIndicator(false));
            });
    }
);

const loadMore = (filterType) => (
    (dispatch, getState, {notify}) => {
        if (!filterType) {
            const errMessage = gettext('Cannot load more data as filter type is not selected.');

            notify.error(errMessage);
            return Promise.reject(errMessage);
        }

        let promise = Promise.resolve();

        dispatch(self.setUnsetLoadingIndicator(true));
        if (filterType === MAIN.FILTERS.EVENTS) {
            promise = dispatch(eventsUi.loadMore());
        } else if (filterType === MAIN.FILTERS.PLANNING) {
            promise = dispatch(planningUi.loadMore());
        } else if (filterType === MAIN.FILTERS.COMBINED) {
            promise = dispatch(eventsPlanningUi.loadMore());
        }

        return promise
            .then(
                (results) => Promise.resolve(results),
                (error) => {
                    notify.error(gettext('Cannot load more data. Failed to run the query.'));
                    return Promise.reject(error);
                }
            )
            .finally(() => {
                dispatch(self.setUnsetLoadingIndicator(false));
            });
    }
);

/**
 * Action to search based on the search parameters
 * @param {string} fulltext - Fulltext search
 * @param {Object} currentSearch - Search params from advanced search
 * @return {Object} - returns Promise
 */
const search = (fulltext, currentSearch = undefined) => (
    (dispatch, getState, {notify}) => {
        let filterType = activeFilter(getState());

        if (!filterType) {
            const errMessage = gettext('Cannot search as filter type is not selected.');

            notify.error(errMessage);
            return Promise.reject(errMessage);
        }

        const previousParams = lastRequestParams(getState());
        const advancedSearch = currentSearch || previousParams.currentSearch || {};
        const params = {
            ...previousParams,
            page: 1,
            fulltext: !isNil(fulltext) ? fulltext : previousParams.fulltext,
            ...advancedSearch
        };

        let promise = Promise.resolve();

        dispatch(self.setUnsetLoadingIndicator(true));
        if (filterType === MAIN.FILTERS.EVENTS) {
            promise = dispatch(eventsUi.fetchEvents(params));
        } else if (filterType === MAIN.FILTERS.PLANNING) {
            promise = dispatch(fetchSelectedAgendaPlannings(params));
        } else if (filterType === MAIN.FILTERS.COMBINED) {
            promise = dispatch(eventsPlanningUi.fetch(params));
        }

        return promise
            .then(
                (results) => Promise.resolve(results),
                (error) => {
                    notify.error(gettext('Failed to run the query..'));
                    return Promise.reject(error);
                }
            )
            .finally(() => {
                dispatch(self.setUnsetLoadingIndicator(false));
            });
    }
);

/**
 * Action to clear the search parameters and reload.
 * @return {function(*, *)}
 */
const clearSearch = () => (
    (dispatch, getState) => {
        let filterType = activeFilter(getState());

        dispatch({
            type: MAIN.ACTIONS.CLEAR_SEARCH,
            payload: filterType
        });

        return dispatch(self._filter(filterType));
    }
);

const setTotal = (filter, total) => ({
    type: MAIN.ACTIONS.SET_TOTAL,
    payload: {
        filter,
        total
    }
});


const setUnsetLoadingIndicator = (value = false) => ({
    type: MAIN.ACTIONS.SET_UNSET_LOADING_INDICATOR,
    payload: value
});


/**
 * Action to open the editor and update the URL
 * @param {object} item - The item to open. Must have _id and type attributes
 */
const openEditor = (item) => (
    (dispatch, getState, {$timeout, $location}) => {
        dispatch({
            type: MAIN.ACTIONS.OPEN_EDITOR,
            payload: item
        });

        // Update the URL
        $timeout(() => $location.search('edit', JSON.stringify({id: item._id, type: item.type})));
    }
);

/**
 * Action to close the editor and update the URL
 */
const closeEditor = () => (
    (dispatch, getState, {$timeout, $location}) => {
        dispatch({type: MAIN.ACTIONS.CLOSE_EDITOR});

        // Update the URL
        $timeout(() => $location.search('edit', null));
    }
);

/**
 * Action to open the preview panel and update the URL
 * @param {object} item - The item to open. Must have _id and type attributes
 */
const openPreview = (item) => (
    (dispatch, getState, {$timeout, $location}) => {
        const currentPreviewId = selectors.main.previewId(getState());

        if (currentPreviewId === item._id) {
            return;
        }

        dispatch({type: MAIN.ACTIONS.PREVIEW_LOADING_START});
        dispatch({
            type: MAIN.ACTIONS.SET_PREVIEW_ITEM,
            payload: {
                itemId: item._id,
                itemType: item.type
            }
        });

        // Update the URL
        $timeout(() => $location.search('preview', JSON.stringify({id: item._id, type: item.type})));
    }
);

/**
 * Action to close the preview panel and update the URL
 */
const closePreview = () => (
    (dispatch, getState, {$timeout, $location}) => {
        dispatch({type: MAIN.ACTIONS.CLOSE_PREVIEW});

        // Update the URL
        $timeout(() => $location.search('preview', null));
    }
);

/**
 * Action to load an item for a specific action (preview/edit).
 * Will dispatch the *_LOADING_START/*_LOADING_COMPLETE actions on start/finish of the action.
 * These actions will indicate to the preview panel/editor that the item is currently loading.
 * This action is executed from the PreviewPanel/Editor React components.
 * @param {string} itemId - The ID of the item to load
 * @param {string} itemType - The type of item to load (ITEM_TYPE.EVENT/ITEM_TYPE.PLANNING)
 * @param {string} action - The action the item is for (MAIN.PREVIEW/MAIN.EDIT)
 */
const loadItem = (itemId, itemType, action) => (
    (dispatch, getState, {notify}) => {
        if (action !== MAIN.PREVIEW && action !== MAIN.EDIT) {
            let error = `Unknown action "${action}"`;

            notify.error(error);
            return Promise.reject(error);
        } else if (itemType !== ITEM_TYPE.EVENT && itemType !== ITEM_TYPE.PLANNING) {
            let error = `Unknown item type "${itemType}"`;

            notify.error(error);
            return Promise.reject(error);
        }

        if (action === MAIN.PREVIEW) {
            dispatch({type: MAIN.ACTIONS.PREVIEW_LOADING_START});
        } else if (action === MAIN.EDIT) {
            dispatch({type: MAIN.ACTIONS.EDIT_LOADING_START});
        }

        let promise;

        if (itemId === null) {
            promise = Promise.resolve({});
        } else if (itemType === ITEM_TYPE.EVENT) {
            promise = dispatch(eventsApi.fetchById(itemId));
        } else if (itemType === ITEM_TYPE.PLANNING) {
            promise = dispatch(planningApi.fetchById(itemId));
        }

        return promise
            .then(
                (item) => Promise.resolve(item),
                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to load the item')
                    );
                    return Promise.reject(error);
                }
            )
            .finally(() => {
                if (action === MAIN.PREVIEW) {
                    dispatch({type: MAIN.ACTIONS.PREVIEW_LOADING_COMPLETE});
                } else if (action === MAIN.EDIT) {
                    dispatch({type: MAIN.ACTIONS.EDIT_LOADING_COMPLETE});
                }
            });
    }
);

/**
 * Action to open either the PreviewPanel or Editor based on the item ID and Type
 * from either the URL params or the redux-store
 * @param {string} action - The action to load the item for (MAIN.PREVIEW/MAIN.EDIT)
 */
const openFromURLOrRedux = (action) => (
    (dispatch, getState, {$location}) => {
        let item;
        const itemSearch = get($location.search(), action) || null;

        if (itemSearch) {
            item = JSON.parse(itemSearch);
        } else if (action === MAIN.PREVIEW) {
            item = {
                id: selectors.main.previewId(getState()),
                type: selectors.main.previewType(getState())
            };
        } else if (action === MAIN.EDIT) {
            item = {
                id: selectors.forms.currentItemId(getState()),
                type: selectors.forms.currentItemType(getState())
            };
        }

        if (item.id && item.type) {
            if (action === MAIN.PREVIEW) {
                dispatch(self.openPreview({
                    _id: item.id,
                    type: item.type
                }));
            } else if (action === MAIN.EDIT) {
                dispatch(self.openEditor({
                    _id: item.id,
                    type: item.type
                }));
            }
        } else {
            // Remove the item from the URL
            $location.search(action, null);
        }
    }
);

// eslint-disable-next-line consistent-this
const self = {
    lockAndEdit,
    unlockAndCancel,
    save,
    unpublish,
    publish,
    openCancelModal,
    openEditor,
    closeEditor,
    filter,
    _filter,
    openConfirmationModal,
    closePreview,
    unlockAndCloseEditor,
    loadMore,
    search,
    clearSearch,
    setTotal,
    closePreviewAndEditorForItems,
    setUnsetLoadingIndicator,
    openFromURLOrRedux,
    loadItem,
    openPreview,
};

export default self;
