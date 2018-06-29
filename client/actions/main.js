import {MAIN, ITEM_TYPE, MODALS, WORKSPACE, WORKFLOW_STATE, POST_STATE, PLANNING, EVENTS} from '../constants';
import {activeFilter, lastRequestParams} from '../selectors/main';
import planningUi from './planning/ui';
import planningApi from './planning/api';
import eventsUi from './events/ui';
import eventsApi from './events/api';
import autosave from './autosave';
import {actionUtils} from '../utils';
import {locks, showModal, hideModal} from './';
import {selectAgenda, fetchSelectedAgendaPlannings} from './agenda';
import {
    getErrorMessage,
    notifyError,
    getItemType,
    gettext,
    eventUtils,
    planningUtils,
    shouldLockItemForEdit,
    shouldUnLockItem,
    getItemTypeString,
    timeUtils,
    isExistingItem,
    lockUtils,
    isItemKilled,
    getItemId,
    isTemporaryId,
    getAutosaveItem,
    itemsEqual,
    removeAutosaveFields,
} from '../utils';
import eventsPlanningUi from './eventsPlanning/ui';
import {get, omit, isEmpty, isNil, isEqual} from 'lodash';

import * as selectors from '../selectors';
import {validateItem} from '../validators';

/**
 * Open the Editor for creating a new item, creating an Autosave entry if item values are provided
 * @param {String} itemType - The type of item to create
 * @param {Object} item - Values to add to the default values for the item
 */
const createNew = (itemType, item = null) => (
    (dispatch, getState) => {
        let newItem;

        if (itemType === ITEM_TYPE.EVENT) {
            newItem = eventUtils.defaultEventValues(
                selectors.vocabs.eventOccurStatuses(getState()),
                selectors.events.defaultCalendarValue(getState())
            );
            newItem._planning_item = get(item, '_planning_item');
        } else if (itemType === ITEM_TYPE.PLANNING) {
            newItem = planningUtils.defaultPlanningValues(
                selectors.planning.currentAgenda(getState())
            );
        }

        const promise = isNil(item) ?
            Promise.resolve() :
            dispatch(autosave.save({
                ...newItem,
                ...item,
            }));

        return promise.then(() => dispatch(self.lockAndEdit(newItem)));
    }
);

const lockAndEdit = (item, modal = false) => (
    (dispatch, getState, {notify}) => {
        const currentItemId = selectors.forms.currentItemId(getState());
        const currentSession = selectors.general.session(getState());
        const lockedItems = selectors.locks.getLockedItems(getState());
        const privileges = selectors.general.privileges(getState());
        const shouldLockItem = shouldLockItemForEdit(item, lockedItems, privileges);

        // If the editor is in main page and this item is already opened and
        // we either have a lock or the item should not get locked.
        // Then simply return the item
        if (currentItemId === item._id && !modal &&
            (!shouldLockItem || lockUtils.isItemLockedInThisSession(item, currentSession))
        ) {
            return Promise.resolve(item);
        }

        // If the item being edited is currently opened in the Preview panel
        // then close the preview panel
        if (selectors.main.previewId(getState()) === item._id) {
            dispatch(self.closePreview());
        }

        dispatch(setLoadingEditItem(modal));

        // If it is an existing item and the item is not locked
        // then lock the item, otherwise return the existing item
        const promise = shouldLockItem ?
            dispatch(locks.lock(item)) :
            Promise.resolve(item);

        return promise.then((lockedItem) => {
            if (!modal) {
                dispatch(self.openEditor(item));
            } else {
                // Open the modal to show the editor
                dispatch(closeEditorAndOpenModal(item));
            }

            dispatch(unsetLoadingEditItem(modal));

            return Promise.resolve(lockedItem);
        }, (error) => {
            notify.error(
                getErrorMessage(error, gettext('Failed to lock the item'))
            );

            dispatch(unsetLoadingEditItem(modal));

            return Promise.reject(error);
        });
    }
);

const unlockAndCancel = (item, modal = false) => (
    (dispatch, getState) => {
        const state = getState();
        let promise = Promise.resolve();

        // If the item exists and is locked in this session
        // then unlock the item
        if (shouldUnLockItem(
            item,
            selectors.general.session(state),
            selectors.general.currentWorkspace(state))
        ) {
            promise = dispatch(locks.unlock(item));
        } else if (get(item, '_planning_item')) {
            promise = dispatch(planningApi.unlock({_id: item._planning_item}));
        } else if (!isExistingItem(item)) {
            promise = dispatch(autosave.removeById(getItemType(item), getItemId(item)));
        }

        if (!modal) {
            dispatch(self.closeEditor());
        } else {
            dispatch(self.closeEditorModal());
        }

        return promise;
    }
);

const save = (item, withConfirmation = true, noSubsequentEditing = false) => (
    (dispatch, getState, {notify}) => {
        const itemId = getItemId(item);
        const itemType = getItemType(item);
        const existingItem = !isTemporaryId(itemId);
        const itemIdModal = selectors.forms.currentItemIdModal(getState());
        const createdFromModal = !existingItem && itemId === itemIdModal;

        if (!existingItem) {
            // If this is a new item being created, then we do not need
            // the temporary ID generated, along with the lock information
            delete item._id;
            delete item.lock_action;
            delete item.lock_user;
            delete item.lock_session;
            delete item.lock_time;
        }

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

                if (!existingItem && selectors.general.currentWorkspace(getState()) !== WORKSPACE.AUTHORING) {
                    if (createdFromModal) {
                        dispatch(self.closeEditorModal());
                    }

                    notify.success(
                        gettext('{{ itemType }} created', {itemType: getItemTypeString(item)})
                    );

                    return dispatch(autosave.removeById(itemType, itemId))
                        // If this item was created from a Planning item
                        // Then unlock the Planning item first
                        .then(() => !get(savedItem, '_planning_item') ?
                            Promise.resolve() :
                            dispatch(locks.unlock({
                                _id: savedItem._planning_item,
                                type: ITEM_TYPE.PLANNING,
                            }))
                        )
                        .then(() => {
                            // And finally lock the newly created item for editing
                            if (!noSubsequentEditing) {
                                return dispatch(self.lockAndEdit(savedItem));
                            }

                            return Promise.resolve();
                        });
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

const unpost = (item, withConfirmation = true) => (
    (dispatch, getState, {notify}) => {
        const itemType = getItemType(item);
        let promise;
        let confirmation = withConfirmation;

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            confirmation = withConfirmation && get(item, 'recurrence_id');
            promise = dispatch(confirmation ?
                eventsUi.postWithConfirmation(item, false) :
                eventsApi.unpost(item)
            );
            break;
        case ITEM_TYPE.PLANNING:
            confirmation = false;
            promise = dispatch(planningApi.unpost(item));
            break;
        default:
            promise = Promise.reject(gettext('Failed to unpost, could not find the item type!'));
        }

        return promise
            .then(
                (rtn) => {
                    if (!confirmation) {
                        notify.success(
                            gettext('The {{ itemType }} has been unposted', {itemType: getItemTypeString(item)})
                        );
                    }
                    return Promise.resolve(rtn);
                },
                (error) => {
                    notifyError(
                        notify,
                        error,
                        gettext('Failed to unpost the {{ itemType }}', {itemType: getItemTypeString(item)})
                    );
                    return Promise.reject(error);
                }
            );
    }
);

const post = (item, withConfirmation = true) => (
    (dispatch, getState, {notify}) => {
        const itemType = getItemType(item);
        let promise;
        let confirmation = withConfirmation;

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            confirmation = withConfirmation && get(item, 'recurrence_id');
            promise = dispatch(confirmation ?
                eventsUi.postWithConfirmation(item, true) :
                eventsApi.post(item)
            );
            break;
        case ITEM_TYPE.PLANNING:
            confirmation = false;
            promise = dispatch(planningApi.post(item));
            break;
        default:
            promise = Promise.reject(gettext('Failed to post, could not find the item type!'));
            break;
        }

        return promise
            .then(
                (rtn) => {
                    if (!confirmation) {
                        notify.success(
                            gettext('The {{ itemType }} has been posted', {itemType: getItemTypeString(item)})
                        );
                    }

                    return Promise.resolve(rtn);
                },
                (error) => {
                    notifyError(
                        notify,
                        error,
                        gettext('Failed to post the {{ itemType }}', {itemType: getItemTypeString(item)})
                    );
                    return Promise.reject(error);
                }
            );
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
            },
        }))
    )
);

const saveAutosave = (item, withConfirmation = true, updateMethod) => (
    (dispatch, getState) => {
        const itemType = getItemType(item);
        const autosaveData = getAutosaveItem(
            selectors.forms.autosaves(getState()),
            itemType,
            getItemId(item)
        );

        if (!autosaveData) {
            return Promise.resolve(item);
        }

        const updatedItem = {
            ...item,
            ...autosaveData,
        };

        if (itemType === ITEM_TYPE.EVENT) {
            updatedItem.update_method = updateMethod;
        }

        return dispatch(self.save(updatedItem, withConfirmation));
    }
);

const isItemValid = (diff) => (
    (dispatch, getState) => {
        const profileName = getItemType(diff);
        const formProfiles = selectors.forms.profiles(getState());
        const errors = {};
        const messages = [];

        dispatch(validateItem({
            profileName,
            diff,
            formProfiles,
            errors,
            messages,
        }));

        return isEqual(errors, {});
    }
);

const openActionModalFromEditor = (item, title, action) => (
    (dispatch, getState) => {
        const lockedItems = selectors.locks.getLockedItems(getState());
        const itemLock = lockUtils.getLock(item, lockedItems);

        const itemId = getItemId(item);
        const itemType = getItemType(item);
        const autosaveData = getAutosaveItem(
            selectors.forms.autosaves(getState()),
            itemType,
            itemId
        );

        const isOpenInEditor = selectors.forms.currentItemId(getState()) === itemId;
        const isOpenInModal = selectors.forms.currentItemIdModal(getState()) === itemId;

        let promise;

        if (itemLock) {
            const storedItems = itemType === ITEM_TYPE.EVENT ?
                selectors.events.storedEvents(getState()) :
                selectors.planning.storedPlannings(getState());
            const originalItem = removeAutosaveFields(get(storedItems, itemId, null));

            // If we have any dirty autosave data, then open the IgnoreCancelSave modal
            if (autosaveData && !itemsEqual(originalItem, autosaveData)) {
                // If the item is currently open in the ItemEditorModal
                // then hide the modal for now (we will show the modal again later)
                if (isOpenInModal) {
                    dispatch(hideModal());
                }

                // Check if item has errors
                const isOpenForEditing = isOpenInEditor || isOpenInModal;
                const isKilled = isItemKilled(item);
                const hasErrors = !dispatch(self.isItemValid({
                    ...item,
                    ...autosaveData,
                }));

                const unlockAndRunAction = (updatedItem) => (
                    dispatch(locks.unlock(updatedItem))
                        .then((unlockedItem) => {
                            dispatch(hideModal());
                            return action(unlockedItem, itemLock, isOpenInEditor, isOpenInModal);
                        })
                );

                promise = dispatch(self.openIgnoreCancelSaveModal({
                    itemId: itemId,
                    itemType: itemType,
                    onCancel: () =>
                        dispatch(hideModal()),
                    onIgnore: unlockAndRunAction.bind(null, item),
                    onGoTo: !isOpenForEditing ?
                        () => {
                            dispatch(hideModal());
                            return dispatch(self.lockAndEdit(item));
                        } :
                        null,
                    onSave: isOpenForEditing && (!isKilled && !hasErrors) ?
                        (withConfirmation, updateMethod) =>
                            dispatch(self.saveAutosave(item, withConfirmation, updateMethod))
                                .then(unlockAndRunAction) :
                        null,
                    onSaveAndPost: isOpenForEditing && (isKilled && !hasErrors) ?
                        (withConfirmation, updateMethod) =>
                            dispatch(self.saveAutosave(
                                {
                                    ...item,
                                    state: WORKFLOW_STATE.SCHEDULED,
                                    pubstatus: POST_STATE.USABLE,
                                },
                                withConfirmation,
                                updateMethod
                            ))
                                .then(unlockAndRunAction) :
                        null,
                    autoClose: false,
                    title: title,
                }));
            } else {
                promise = dispatch(locks.unlock(item))
                    .then((unlockedItem) => action(unlockedItem, itemLock, isOpenInEditor, isOpenInModal));
            }
        } else {
            promise = action(item, itemLock, isOpenInEditor, isOpenInModal);
        }

        return promise;
    }
);

const openIgnoreCancelSaveModal = ({
    itemId,
    itemType,
    onCancel,
    onIgnore,
    onSave,
    onGoTo,
    onSaveAndPost,
    title,
    autoClose = true,
}) => (
    (dispatch, getState) => {
        const autosaveData = getAutosaveItem(
            selectors.forms.autosaves(getState()),
            itemType,
            itemId
        ) || {};

        if (itemId && !autosaveData) {
            return onIgnore();
        }

        const storedItems = itemType === ITEM_TYPE.EVENT ?
            selectors.events.storedEvents(getState()) :
            selectors.planning.storedPlannings(getState());

        const item = {
            ...get(storedItems, itemId) || {},
            ...autosaveData,
        };

        if (!isExistingItem(item)) {
            delete item._id;
        }

        let promise = Promise.resolve(item);

        if (itemType === ITEM_TYPE.EVENT && eventUtils.isEventRecurring(item)) {
            const originalEvent = get(storedItems, event._id, {});
            const maxRecurringEvents = selectors.config.getMaxRecurrentEvents(getState());

            promise = dispatch(eventsApi.query({
                recurrenceId: originalEvent.recurrence_id,
                maxResults: maxRecurringEvents,
                onlyFuture: false,
            }))
                .then((relatedEvents) => ({
                    ...item,
                    _recurring: relatedEvents || [item],
                    _events: [],
                    _originalEvent: originalEvent,
                }));
        }

        return promise
            .then((itemWithAssociatedData) => (
                dispatch(showModal({
                    modalType: MODALS.IGNORE_CANCEL_SAVE,
                    modalProps: {
                        item: itemWithAssociatedData,
                        itemType: itemType,
                        onCancel: onCancel,
                        onIgnore: onIgnore,
                        onSave: onSave,
                        onGoTo: onGoTo,
                        onSaveAndPost: onSaveAndPost,
                        title: title,
                        autosaveData: autosaveData,
                        autoClose: autoClose,
                    },
                }))
            ));
    }
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
            params.advancedSearch = eventUtils.modifyForClient(get(params, 'advancedSearch'));
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
            promise = dispatch(eventsUi.selectCalendar($location.search().calendar, params));
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
            ...advancedSearch,
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
            payload: filterType,
        });

        return dispatch(self._filter(filterType));
    }
);

const setTotal = (filter, total) => ({
    type: MAIN.ACTIONS.SET_TOTAL,
    payload: {
        filter,
        total,
    },
});


const setUnsetLoadingIndicator = (value = false) => ({
    type: MAIN.ACTIONS.SET_UNSET_LOADING_INDICATOR,
    payload: value,
});


/**
 * Action to open the editor and update the URL
 * @param {object} item - The item to open. Must have _id and type attributes
 */
const openEditor = (item, updateUrl = true) => (
    (dispatch, getState, {$timeout, $location}) => {
        dispatch({
            type: MAIN.ACTIONS.OPEN_EDITOR,
            payload: item,
        });

        // Update the URL
        if (updateUrl) {
            $timeout(() => $location.search('edit', JSON.stringify({id: getItemId(item), type: getItemType(item)})));
        }
    }
);

const closeEditorAndOpenModal = (item) => (
    (dispatch, getState) => {
        const currentItemId = selectors.forms.currentItemId(getState());

        if (currentItemId === getItemId(item)) {
            dispatch(self.closeEditor());
        }

        // Open the modal to show the editor
        dispatch(showModal({
            modalType: MODALS.EDIT_ITEM,
            modalProps: {item},
        }));
    }
);

/**
 * Action to open the editor for modalView
 * @param {object} item - The item to open. Must have _id and type attributes
 */
const openEditorModal = (item) => ({
    type: MAIN.ACTIONS.OPEN_EDITOR_MODAL,
    payload: item,
});

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
 * Action to close the editor modal
 */
const closeEditorModal = () => (
    (dispatch) => {
        dispatch({type: MAIN.ACTIONS.CLOSE_EDITOR_MODAL});
        dispatch(hideModal());
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
                itemType: item.type,
            },
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
 * Action to fetch an Event or Planning by its ID
 * If the itemId or itemType is not supplied then an empty object is returned
 * @param {string} itemId - The ID of the item to fetch
 * @param {string} itemType - The type of the item to fetch
 */
const fetchById = (itemId, itemType) => (
    (dispatch) => {
        if (itemId !== null && !isTemporaryId(itemId)) {
            if (itemType === ITEM_TYPE.EVENT) {
                return dispatch(eventsApi.fetchById(itemId));
            } else if (itemType === ITEM_TYPE.PLANNING) {
                return dispatch(planningApi.fetchById(itemId));
            }
        }

        return Promise.resolve(null);
    }
);

/**
 * Action to load an item for a specific action (preview/edit).
 * Will dispatch the *_LOADING_START/*_LOADING_COMPLETE actions on start/finish of the action.
 * These actions will indicate to the preview panel/editor that the item is currently loading.
 * This action is executed from the PreviewPanel/Editor React components.
 * This action won't be hit on Editor Modal.
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

        return dispatch(self.fetchById(itemId, itemType))
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
 * Action to open Modals based on the locks being held by the current session
 */
const openFromLockActions = () => (
    (dispatch, getState) => {
        const sessionLastLock = selectors.locks.getLastSessionLock(getState());

        if (sessionLastLock) {
            const action = Object.values(Object.assign({},
                PLANNING.ITEM_ACTIONS,
                EVENTS.ITEM_ACTIONS)).filter((a) => a.lock_action == sessionLastLock.action);

            if (action) {
                /* get the item we're operating on */
                dispatch(self.fetchById(sessionLastLock.item_id, sessionLastLock.item_type)).then((item) => {
                    actionUtils.getActionDispatches({dispatch: dispatch, eventOnly: false,
                        planningOnly: false})[action[0].actionName](item, false, false);
                });
            }
        }
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
                type: selectors.main.previewType(getState()),
            };
        } else if (action === MAIN.EDIT) {
            item = {
                id: selectors.forms.currentItemId(getState()),
                type: selectors.forms.currentItemType(getState()),
            };
        }

        if (item.id && item.type) {
            // Make sure the item is loaded into the redux store
            // and store the entire item in the forms initialValues
            return dispatch(self.fetchById(item.id, item.type))
                .then((loadedItem) => {
                    if (action === MAIN.PREVIEW) {
                        return dispatch(self.openPreview(loadedItem || {
                            _id: item.id,
                            type: item.type,
                        }));
                    } else if (action === MAIN.EDIT) {
                        return dispatch(self.openEditor(loadedItem || {
                            _id: item.id,
                            type: item.type,
                        }));
                    }
                });
        }

        // Remove the item from the URL
        $location.search(action, null);
        return Promise.resolve();
    }
);

const setJumpInterval = (value) => ({
    type: MAIN.ACTIONS.SET_JUMP_INTERVAL,
    payload: value,
});

const setLoadingEditItem = (modal = false) => {
    if (!modal) {
        return {type: MAIN.ACTIONS.EDIT_LOADING_START};
    } else {
        return {type: MAIN.ACTIONS.EDIT_LOADING_START_MODAL};
    }
};

const unsetLoadingEditItem = (modal = false) => {
    if (!modal) {
        return {type: MAIN.ACTIONS.EDIT_LOADING_COMPLETE};
    } else {
        return {type: MAIN.ACTIONS.EDIT_LOADING_COMPLETE_MODAL};
    }
};

const jumpTo = (direction) => (
    (dispatch, getState) => {
        let newStart;

        if (direction === MAIN.JUMP.TODAY) {
            newStart = null;
        } else {
            const jumpInterval = selectors.main.currentJumpInterval(getState());
            const currentStartFilter = selectors.main.currentStartFilter(getState());

            if (jumpInterval === MAIN.JUMP.DAY) {
                newStart = direction === MAIN.JUMP.BACK ?
                    currentStartFilter.clone().subtract(1, 'd') :
                    currentStartFilter.clone().add(1, 'd');
            } else if (jumpInterval === MAIN.JUMP.WEEK) {
                const startOfWeek = selectors.config.getStartOfWeek(getState());

                newStart = direction === MAIN.JUMP.FORWARD ?
                    timeUtils.getStartOfNextWeek(currentStartFilter, startOfWeek) :
                    timeUtils.getStartOfPreviousWeek(currentStartFilter, startOfWeek);
            } else if (jumpInterval === MAIN.JUMP.MONTH) {
                newStart = direction === MAIN.JUMP.FORWARD ?
                    timeUtils.getStartOfNextMonth(currentStartFilter) :
                    timeUtils.getStartOfPreviousMonth(currentStartFilter);
            }
        }

        dispatch(self.setStartFilter(newStart));
    }
);

const setStartFilter = (start) => (
    (dispatch, getState) => {
        dispatch({
            type: MAIN.ACTIONS.JUMP_TO,
            payload: start,
        });

        dispatch(self.search(
            selectors.main.fullText(getState()),
            {advancedSearch: selectors.main.currentAdvancedSearch(getState())}
        ));
    }
);

const notifyValidationErrors = (messages) => (
    (dispatch, getState, {notify}) => {
        messages.forEach((message) => notify.error(message));
    }
);

const fetchItemHistory = (item) => (
    (dispatch, getState) => {
        let historyDispatch;
        const previewId = selectors.main.previewId(getState());
        const editId = selectors.forms.currentItemId(getState());

        if (!isExistingItem(item) || (previewId !== item._id && editId !== item._id)) {
            return Promise.resolve();
        }

        switch (getItemType(item)) {
        case ITEM_TYPE.EVENT:
            historyDispatch = eventsApi.fetchEventHistory;
            break;
        case ITEM_TYPE.PLANNING:
            historyDispatch = planningApi.fetchPlanningHistory;
            break;
        }

        return dispatch(historyDispatch(item._id)).then((historyItems) => {
            if (editId === item._id) {
                dispatch({
                    type: MAIN.ACTIONS.RECEIVE_EDITOR_ITEM_HISTORY,
                    payload: historyItems,
                });
            }

            if (previewId === item._id) {
                dispatch({
                    type: MAIN.ACTIONS.RECEIVE_PREVIEW_ITEM_HISTORY,
                    payload: historyItems,
                });
            }

            return Promise.resolve();
        });
    }
);

/**
 * Action to reset the initial values in the editor
 * @param {object} item - planning or event item from store
 */
const reloadEditor = (item) => (
    (dispatch, getState) => {
        if (item._id === selectors.forms.currentItemId(getState())) {
            dispatch(self.openEditor(item, false));
        } else if (item._id === selectors.forms.currentItemIdModal(getState())) {
            dispatch(self.openEditorModal(item));
        }
    }
);

// eslint-disable-next-line consistent-this
const self = {
    lockAndEdit,
    unlockAndCancel,
    save,
    unpost,
    post,
    openEditor,
    openEditorModal,
    closeEditor,
    closeEditorModal,
    closeEditorAndOpenModal,
    filter,
    _filter,
    openConfirmationModal,
    closePreview,
    loadMore,
    search,
    clearSearch,
    setTotal,
    closePreviewAndEditorForItems,
    setUnsetLoadingIndicator,
    openFromURLOrRedux,
    openFromLockActions,
    loadItem,
    openPreview,
    setJumpInterval,
    jumpTo,
    notifyValidationErrors,
    setStartFilter,
    openIgnoreCancelSaveModal,
    saveAutosave,
    openActionModalFromEditor,
    isItemValid,
    createNew,
    fetchById,
    fetchItemHistory,
    reloadEditor,
};

export default self;
