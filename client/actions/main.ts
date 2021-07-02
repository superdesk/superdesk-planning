import {get, isEmpty, isEqual, isNil, omit} from 'lodash';
import moment from 'moment';

import {appConfig} from 'appConfig';
import {planningApi as planningApis, superdeskApi} from '../superdeskApi';
import {
    EDITOR_TYPE,
    ICombinedEventOrPlanningSearchParams,
    ISearchFilter,
    ISearchParams,
    LIST_VIEW_TYPE,
    PLANNING_VIEW,
} from '../interfaces';

import {
    AGENDA,
    EVENTS,
    ITEM_TYPE,
    MAIN,
    MODALS,
    PLANNING,
    POST_STATE,
    QUEUE_ITEM_PREFIX,
    WORKFLOW_STATE,
    WORKSPACE,
} from '../constants';
import {activeFilter, lastRequestParams} from '../selectors/main';
import planningUi from './planning/ui';
import planningApi from './planning/api';
import eventsUi from './events/ui';
import eventsApi from './events/api';
import autosave from './autosave';
import {
    actionUtils,
    eventUtils,
    generateTempId,
    getAutosaveItem,
    getErrorMessage,
    getItemId,
    getItemType,
    getItemTypeString,
    gettext,
    isExistingItem,
    isItemKilled,
    isItemSameAsAutosave,
    isItemSpiked,
    isPublishedItemId,
    isTemporaryId,
    lockUtils,
    modifyForClient,
    notifyError,
    planningUtils,
    shouldLockItemForEdit,
    shouldUnLockItem,
    timeUtils
} from '../utils';
import {hideModal, locks, showModal} from './';
import {fetchSelectedAgendaPlannings} from './agenda';
import eventsPlanningUi from './eventsPlanning/ui';

import * as selectors from '../selectors';
import {validateItem} from '../validators';
import {searchParamsToOld} from '../utils/search';

const openForEdit = (item, updateUrl = true, modal = false) => (
    (dispatch, getState) => {
        if (!isExistingItem(item)) {
            return dispatch(
                self.openEditorAction(item, 'create', updateUrl, modal)
            );
        }

        const currentSession = selectors.general.session(getState());
        const lockedItems = selectors.locks.getLockedItems(getState());
        const privileges = selectors.general.privileges(getState());
        const shouldLockItem = shouldLockItemForEdit(item, lockedItems, privileges);
        const lockedInThisSession = lockUtils.isItemLockedInThisSession(
            item,
            currentSession,
            lockedItems
        );
        const lockAction = lockUtils.getLockAction(item, lockedItems);
        const lockedForEditing = ['edit', 'add_to_planning'].indexOf(lockAction) >= 0;

        const action = (shouldLockItem || (lockedInThisSession && lockedForEditing)) ?
            'edit' :
            'read';

        dispatch(
            self.openEditorAction(item, action, updateUrl, modal)
        );
    }
);

const openEditorAction = (item, action, updateUrl = true, modal = false) => (
    (dispatch, getState, {$timeout, $location}) => {
        const state = getState();
        const itemId = getItemId(item);
        const itemType = getItemType(item);

        // If the item being edited is currently opened in the Preview panel
        // then close the preview panel
        if (selectors.main.previewId(state) === itemId) {
            dispatch(self.closePreview());
        }

        // If the panel editor is currently open, then close it
        // This reset's the Editor's states, bookmarks, groups and DOM refs
        if (selectors.forms.currentItemId(state) != null || selectors.forms.currentItemType(state) != null) {
            dispatch(closeEditor());
        }

        dispatch({
            type: MAIN.ACTIONS.OPEN_FOR_EDIT,
            payload: {item, action, modal},
        });

        if (modal) {
            if (selectors.forms.currentItemId(getState()) === itemId) {
                dispatch(self.closeEditor());
            }
        } else if (updateUrl) {
            // Update the URL
            $timeout(() => $location.search('edit', JSON.stringify({
                id: itemId,
                type: itemType,
            })));
        }
    }
);

const changeEditorAction = (action, modal = false) => ({
    type: MAIN.ACTIONS.CHANGE_EDITOR_ACTION,
    payload: {action, modal},
});

/**
 * Open the Editor for creating a new item, creating an Autosave entry if item values are provided
 * @param {String} itemType - The type of item to create
 * @param {Object} item - Values to add to the default values for the item
 * @param {Boolean} updateUrl - If true updates the url params
 * @param {Boolean} modal - If true, create this item in the modal editor
 */
const createNew = (itemType, item = null, updateUrl = true, modal = false) => (
    self.openEditorAction({
        _id: generateTempId(),
        type: itemType,
        ...item,
    }, 'create', updateUrl, modal)
);

const unlockAndCancel = (item, ignoreSession = false) => (
    (dispatch, getState) => {
        const state = getState();
        const itemId = getItemId(item);
        const itemType = getItemType(item);
        let promise = Promise.resolve();

        // If the item exists and is locked in this session
        // then unlock the item
        if (shouldUnLockItem(
            item,
            selectors.general.session(state),
            selectors.general.currentWorkspace(state),
            selectors.locks.getLockedItems(state),
            ignoreSession
        )) {
            promise = dispatch(locks.unlock(item));
            if (isExistingItem(item)) {
                promise.then(
                    () => dispatch(autosave.removeById(itemType, itemId))
                );
            }
        } else if (!isExistingItem(item)) {
            promise = dispatch(autosave.removeById(itemType, itemId));
        }

        if (itemType === ITEM_TYPE.EVENT) {
            dispatch(eventsUi.onEventEditUnlock(item));
        }

        if (selectors.forms.currentItemId(state) === itemId) {
            dispatch(self.closeEditor(false));
        } else if (selectors.forms.currentItemIdModal(state) === itemId) {
            dispatch(self.closeEditor(true));
        }

        return promise;
    }
);

const save = (original, updates, withConfirmation = true) => (
    (dispatch, getState, {notify}) => {
        const itemId = getItemId(updates);
        const itemType = getItemType(updates);
        const existingItem = !isTemporaryId(itemId);

        if (!existingItem) {
            // If this is a new item being created, then we do not need
            // the temporary ID generated, along with the lock information
            delete updates._id;
            delete updates.lock_action;
            delete updates.lock_user;
            delete updates.lock_session;
            delete updates.lock_time;
        }

        let promise;
        let confirmation = withConfirmation;

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            promise = dispatch(eventsUi.save(original, updates, confirmation));
            break;
        case ITEM_TYPE.PLANNING:
            confirmation = false;
            promise = dispatch(planningUi.save(original, updates));
            break;
        default:
            promise = Promise.reject(
                gettext(
                    'Failed to save, could not find the item {{itemType}}!',
                    {itemType: itemType}
                )
            );
            break;
        }

        return promise
            .then((savedItems) => {
                // This occurs during an 'Ignore/Cancel/Save' from ModalEditor
                // And the user clicks on 'Cancel'
                if (!savedItems) {
                    return Promise.resolve();
                }

                let savedItem = Array.isArray(savedItems) ? savedItems[0] : savedItems;

                savedItem = modifyForClient(savedItem);

                if (!confirmation && [ITEM_TYPE.EVENT, ITEM_TYPE.PLANNING].indexOf(itemType) >= 0) {
                    const typeString = getItemTypeString(savedItem);

                    if (existingItem) {
                        notify.success(
                            gettext(
                                'The {{ itemType }} has been saved',
                                {itemType: typeString}
                            )
                        );
                    } else {
                        notify.success(
                            gettext(
                                '{{ itemType }} created',
                                {itemType: typeString}
                            )
                        );
                    }
                }

                switch (itemType) {
                case ITEM_TYPE.EVENT:
                    dispatch(
                        eventsApi.receiveEvents([savedItem])
                    );
                    break;
                case ITEM_TYPE.PLANNING:
                    dispatch(
                        planningApi.receivePlannings([savedItem])
                    );
                    break;
                }

                return Promise.resolve(savedItem);
            }, (error) => {
                notify.error(
                    getErrorMessage(
                        error,
                        gettext(
                            'Failed to save the {{itemType}}!',
                            {itemType: getItemTypeString(original)}
                        )
                    )
                );

                return Promise.reject(error);
            });
    }
);

const unpost = (original, updates = {}, withConfirmation = true) => (
    (dispatch, getState, {notify}) => {
        let promise;
        let confirmation = withConfirmation;

        updates.pubstatus = POST_STATE.CANCELLED;

        switch (getItemType(original)) {
        case ITEM_TYPE.EVENT:
            confirmation = withConfirmation &&
                (get(original, 'recurrence_id') || eventUtils.eventHasPlanning(original));
            promise = dispatch(confirmation ?
                eventsUi.postWithConfirmation(original, updates, false) :
                eventsApi.unpost(original, updates)
            );
            break;
        case ITEM_TYPE.PLANNING:
            confirmation = false;
            promise = dispatch(planningApi.unpost(original, updates));
            break;
        default:
            promise = Promise.reject(
                gettext('Failed to unpost, could not find the item type!')
            );
        }

        const typeString = getItemTypeString(original);

        return promise
            .then(
                (rtn) => {
                    if (!confirmation) {
                        notify.success(
                            gettext(
                                'The {{ itemType }} has been unposted',
                                {itemType: typeString}
                            )
                        );
                    }
                    return Promise.resolve(rtn);
                },
                (error) => {
                    notifyError(
                        notify,
                        error,
                        gettext(
                            'Failed to unpost the {{ itemType }}',
                            {itemType: typeString}
                        )
                    );
                    return Promise.reject(error);
                }
            );
    }
);

const post = (original, updates = {}, withConfirmation = true) => (
    (dispatch, getState, {notify}) => {
        let promise;
        let confirmation = withConfirmation;

        updates.pubstatus = POST_STATE.USABLE;

        switch (getItemType(original)) {
        case ITEM_TYPE.EVENT:
            confirmation = withConfirmation && get(original, 'recurrence_id');
            promise = dispatch(confirmation ?
                eventsUi.postWithConfirmation(original, updates, true) :
                eventsApi.post(original, updates)
            );
            break;
        case ITEM_TYPE.PLANNING:
            confirmation = false;
            promise = dispatch(eventsUi.openEventPostModal(
                original,
                updates,
                true,
                null,
                {},
                original,
                planningApi.post.bind(null, original, updates)));
            break;
        default:
            promise = Promise.reject(
                gettext('Failed to post, could not find the item type!')
            );
            break;
        }

        const typeString = getItemTypeString(original);

        return promise
            .then(
                (rtn) => {
                    if (!confirmation && rtn) {
                        notify.success(
                            gettext(
                                'The {{ itemType }} has been posted',
                                {itemType: typeString}
                            )
                        );
                    }

                    return Promise.resolve(rtn);
                },
                (error) => {
                    notifyError(
                        notify,
                        error,
                        gettext(
                            'Failed to post the {{ itemType }}',
                            {itemType: typeString}
                        )
                    );
                    return Promise.reject(error);
                }
            );
    }
);

const openConfirmationModal = ({title, body, okText, showIgnore, action, ignore, autoClose}) => (
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
                autoClose,
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

        return dispatch(self.save(
            item,
            updatedItem,
            withConfirmation
        ));
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

const openActionModalFromEditor = (original, title, action) => (
    (dispatch, getState) => {
        const lockedItems = selectors.locks.getLockedItems(getState());
        const itemLock = lockUtils.getLock(original, lockedItems);

        const itemId = getItemId(original);
        const itemType = getItemType(original);
        const autosaveData = getAutosaveItem(
            selectors.forms.autosaves(getState()),
            itemType,
            itemId
        );

        const isOpenInEditor = selectors.forms.currentItemId(getState()) === itemId;
        const isOpenInModal = selectors.forms.currentItemIdModal(getState()) === itemId;

        // Unlock the item and change the Editor to read-only (if it's currently open)
        // This helps to clear the Editor states before performing the action
        const unlockAndSetEditorReadOnly = (itemToUnlock) => (
            Promise.all([
                dispatch(locks.unlock(itemToUnlock)),
                (isOpenInEditor || isOpenInModal) ?
                    dispatch(self.changeEditorAction('read', isOpenInModal)) :
                    Promise.resolve(),
            ])
                .then((results) => modifyForClient(results[0]))
        );

        if (!itemLock) {
            return action(original, itemLock, isOpenInEditor, isOpenInModal);
        } else if (!autosaveData || isItemSameAsAutosave(
            original,
            autosaveData,
            selectors.events.storedEvents(getState()),
            selectors.planning.storedPlannings(getState())
        )) {
            return unlockAndSetEditorReadOnly(original)
                .then((unlockedItem) => action(
                    unlockedItem,
                    itemLock,
                    isOpenInEditor,
                    isOpenInModal
                ));
        }

        // Check if item has errors
        const isOpenForEditing = isOpenInEditor || isOpenInModal;
        const isKilled = isItemKilled(original);
        const hasErrors = !dispatch(self.isItemValid({
            ...original,
            ...autosaveData,
        }));

        const unlockAndRunAction = (updatedItem, removeAutosave = false) => (
            unlockAndSetEditorReadOnly(updatedItem)
                .then((unlockedItem) => {
                    if (autosaveData && removeAutosave) {
                        dispatch(autosave.remove(autosaveData));
                    }

                    dispatch(hideModal());
                    return action(
                        unlockedItem,
                        itemLock,
                        isOpenInEditor,
                        isOpenInModal
                    );
                })
        );

        const onGoTo = !isOpenForEditing ?
            () => {
                dispatch(hideModal());
                return dispatch(self.openForEdit(
                    original,
                    !isOpenInModal,
                    isOpenInModal
                ));
            } :
            null;

        const onSave = isOpenForEditing && (!isKilled && !hasErrors) ?
            (withConfirmation, updateMethod) =>
                dispatch(self.saveAutosave(original, withConfirmation, updateMethod))
                    .then(unlockAndRunAction) :
            null;

        const onSaveAndPost = isOpenForEditing && (isKilled && !hasErrors) ?
            (withConfirmation, updateMethod) =>
                dispatch(self.saveAutosave(
                    {
                        ...original,
                        state: WORKFLOW_STATE.SCHEDULED,
                        pubstatus: POST_STATE.USABLE,
                    },
                    withConfirmation,
                    updateMethod
                ))
                    .then(unlockAndRunAction) :
            null;

        return dispatch(self.openIgnoreCancelSaveModal({
            itemId: itemId,
            itemType: itemType,
            onCancel: () => dispatch(hideModal()),
            onIgnore: unlockAndRunAction.bind(null, original, true),
            onGoTo: onGoTo,
            onSave: onSave,
            onSaveAndPost: onSaveAndPost,
            autoClose: false,
            title: title,
        }));
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

        if (itemId && isItemSameAsAutosave(
            {
                _id: itemId,
                type: itemType,
            },
            autosaveData,
            selectors.events.storedEvents(getState()),
            selectors.planning.storedPlannings(getState()))) {
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
            const originalEvent = get(storedItems, itemId, {});

            promise = dispatch(eventsApi.query({
                recurrenceId: originalEvent.recurrence_id,
                maxResults: appConfig.max_recurrent_events,
                onlyFuture: false,
            }))
                .then((relatedEvents) => ({
                    ...item,
                    _recurring: relatedEvents || [item],
                    _events: [],
                    _originalEvent: originalEvent,
                }));
        }

        return promise.then((itemWithAssociatedData) => (
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

const closePreviewAndEditorForItems = (items, actionMessage = null, field = '_id', unlock = false) => (
    (dispatch, getState, {notify}) => {
        const previewId = selectors.main.previewId(getState());
        const editId = selectors.forms.currentItemId(getState());

        if (previewId && items.find((i) => get(i, field) === previewId)) {
            dispatch(self.closePreview());

            if (actionMessage != null && actionMessage.length > 0) {
                notify.warning(actionMessage);
            }
        }

        if (editId) {
            const itemInEditor = items.find((i) => get(i, field) === editId);

            if (itemInEditor) {
                if (!unlock) {
                    dispatch(self.closeEditor());
                } else {
                    dispatch(self.unlockAndCancel(itemInEditor));
                }
            }

            if (actionMessage != null && actionMessage.length > 0) {
                notify.warning(actionMessage);
            }
        }

        items.forEach((item) => {
            const itemType = (get(item, field) in selectors.planning.storedPlannings(getState())) ?
                ITEM_TYPE.PLANNING : ITEM_TYPE.EVENT;
            const autoSaves = selectors.forms.autosaves(getState());

            if (getAutosaveItem(autoSaves, itemType, item[field])) {
                dispatch(autosave.removeLocalAutosave({
                    _id: item[field],
                    type: itemType,
                }));
            }
        });

        return Promise.resolve();
    }
);

// Action to fetch data from events, planning or both.
function filter(ftype?: PLANNING_VIEW) {
    return (dispatch, getState) => {
        const {urlParams} = superdeskApi.browser.location;
        const isNewSearch = urlParams.getBoolean('isNewSearch', false);
        const listViewType = (urlParams.getString('listViewType') as LIST_VIEW_TYPE) ||
            LIST_VIEW_TYPE.SCHEDULE;
        const filterType = ftype ||
            (urlParams.getString('filter') as PLANNING_VIEW) ||
            activeFilter(getState()) ||
            PLANNING_VIEW.COMBINED;

        // Set the Redux/URL params for `filter`
        dispatch({
            type: MAIN.ACTIONS.FILTER,
            payload: filterType,
        });
        urlParams.setString('filter', filterType);

        // Set the Redux/URL params for `listViewType`
        dispatch({
            type: MAIN.ACTIONS.SET_LIST_VIEW_TYPE,
            payload: listViewType,
        });
        urlParams.setString('listViewType', listViewType);

        const previousParams = omit(lastRequestParams(getState()) || {}, 'page');
        const searchParams = omit(urlParams.getJson('searchParams', {}), 'page');
        let params = previousParams;

        if (filterType === urlParams.getString('filter') && isEmpty(previousParams) || isNewSearch) {
            params = searchParams;
        }

        if (get(params, 'advancedSearch.dates')) {
            params.advancedSearch = eventUtils.modifyForClient(get(params, 'advancedSearch'));
        }


        return dispatch(self._filter(filterType, params));
    };
}

/**
 * Action to fetch data from events, planning or both.
 * @param {string} filterType - type of filter
 * @param {Object} params - Search params from advanced search
 * @return {Object} - returns Promise
 */
function _filter(filterType: PLANNING_VIEW, params: ICombinedEventOrPlanningSearchParams = {}) {
    return (dispatch, getState, {$location, notify}) => {
        const {urlParams} = superdeskApi.browser.location;
        let promise = Promise.resolve();
        const lastParams = selectors.main.lastRequestParams(getState());
        const currentFilterId: ISearchFilter['_id'] = urlParams.getString('eventsPlanningFilter');

        if (currentFilterId != undefined || filterType === PLANNING_VIEW.COMBINED) {
            promise = planningApis.ui.list.changeFilterId(currentFilterId, params);
        } else if (filterType === PLANNING_VIEW.EVENTS) {
            const calendar = urlParams.getString('calendar') ||
                lastParams?.calendars?.[0] ||
                (lastParams?.noCalendarAssigned ?
                    EVENTS.FILTER.NO_CALENDAR_ASSIGNED :
                    EVENTS.FILTER.ALL_CALENDARS
                );

            const calender = $location.search().calendar ||
                get(lastParams, 'calendars[0]', null) ||
                (get(lastParams, 'noCalendarAssigned', false) ?
                    EVENTS.FILTER.NO_CALENDAR_ASSIGNED :
                    EVENTS.FILTER.ALL_CALENDARS
                );

            promise = planningApis.ui.list.changeCalendarId(
                calender,
                params
            );
        } else if (filterType === PLANNING_VIEW.PLANNING) {
            const searchAgenda = $location.search().agenda ||
                get(lastParams, 'agendas[0]', null) ||
                (get(lastParams, 'noAgendaAssigned', false) ?
                    AGENDA.FILTER.NO_AGENDA_ASSIGNED :
                    AGENDA.FILTER.ALL_PLANNING
                );

            promise = planningApis.ui.list.changeAgendaId(
                searchAgenda,
                params
            );
        }

        return promise.catch((error) => {
            notify.error(gettext('Failed to run the query'));
            return Promise.reject(error);
        });
    };
}

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
        const dates = get(advancedSearch, 'advancedSearch.dates') || {};

        // If an end date has been provided without a start date
        // then default the start date to 1 day before the end date
        if (!dates.range && !dates.start && dates.end) {
            dates.start = moment(dates.end).subtract(1, 'days');
        }

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

        dispatch(self.setUnsetUserInitiatedSearch(true));
        return promise
            .then(
                (results) => Promise.resolve(results),
                (error) => {
                    notify.error(gettext('Failed to run the query..'));
                    return Promise.reject(error);
                }
            )
            .finally(() => {
                dispatch(self.setUnsetUserInitiatedSearch(false));
                dispatch(self.setUnsetLoadingIndicator(false));
            });
    }
);

function searchAdvancedSearch(params: ISearchParams, activeFilter: string) {
    return (dispatch) => {
        const oldParams = searchParamsToOld(params, activeFilter);

        return dispatch(search(params.full_text, oldParams));
    };
}

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

const setUnsetUserInitiatedSearch = (value) => ({
    type: MAIN.ACTIONS.SET_UNSET_USER_INITIATED_SEARCH,
    payload: value,
});

/**
 * Action to close the editor and update the URL
 */
const closeEditor = (modal = false) => (
    (dispatch, getState, {$timeout, $location}) => {
        dispatch({
            type: MAIN.ACTIONS.CLOSE_EDITOR,
            payload: modal,
        });

        planningApis.editor(modal ? EDITOR_TYPE.POPUP : EDITOR_TYPE.INLINE)
            .events.onEditorClosed();

        if (!modal) {
            // Update the URL
            $timeout(() => $location.search('edit', null));
        }
    }
);

/**
 * Action to open the preview panel and update the URL
 * @param {object} item - The item to open. Must have _id and type attributes
 */
const openPreview = (item, focusPreview?: boolean) => (
    (dispatch, getState, {$timeout, $location}) => {
        const currentPreviewId = selectors.main.previewId(getState());
        const maybeFocusPreview = () => {
            if (focusPreview !== true) {
                return;
            }

            const el = document.querySelector('#preview-content');

            if (el instanceof HTMLElement) {
                el.focus();
            }
        };

        if (currentPreviewId === item._id) {
            maybeFocusPreview();
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

        if (!isPublishedItemId(item._id)) {
            // Update the URL
            $timeout(() => $location.search('preview', JSON.stringify({id: item._id, type: item.type})));
        }

        setTimeout(maybeFocusPreview, 200);
    }
);

/**
 * Action to close the preview panel and update the URL
 */
const closePreview = () => (
    (dispatch, getState, {$timeout, $location}) => {
        if (selectors.main.publishQueuePreviewItem(getState())) {
            $timeout(() => $location.search('_id', null));
        }

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
 * @param {boolean} force - Force using the API instead of Redux store
 */
const fetchById = (itemId, itemType, force = false) => (
    (dispatch) => {
        if (itemId !== null && !isTemporaryId(itemId)) {
            if (itemType === ITEM_TYPE.EVENT) {
                return dispatch(eventsApi.fetchById(itemId, {force}));
            } else if (itemType === ITEM_TYPE.PLANNING) {
                return dispatch(planningApi.fetchById(itemId, {force}));
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

        if (get(sessionLastLock, 'action')) {
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
            const baseItem = {
                _id: item.id,
                type: item.type,
            };

            if (action === MAIN.EDIT) {
                dispatch(self.openForEdit(baseItem));

                return Promise.resolve(baseItem);
            } else if (action === MAIN.PREVIEW) {
                // Make sure the item is loaded into the redux store
                // and store the entire item in the forms initialValues
                return dispatch(self.fetchById(item.id, item.type))
                    .then((loadedItem) => {
                        dispatch(self.openPreview(loadedItem || baseItem));

                        return Promise.resolve(loadedItem || baseItem);
                    });
            }
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
                newStart = direction === MAIN.JUMP.FORWARD ?
                    timeUtils.getStartOfNextWeek(currentStartFilter, appConfig.start_of_week) :
                    timeUtils.getStartOfPreviousWeek(currentStartFilter, appConfig.start_of_week);
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
        const editIdModal = selectors.forms.currentItemIdModal(getState());

        if (!isExistingItem(item) || ![previewId, editIdModal, editId].includes(item._id)) {
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
                    payload: {
                        items: historyItems,
                        modal: false,
                    },
                });
            }

            if (previewId === item._id) {
                dispatch({
                    type: MAIN.ACTIONS.RECEIVE_PREVIEW_ITEM_HISTORY,
                    payload: historyItems,
                });
            }

            if (editIdModal === item._id) {
                dispatch({
                    type: MAIN.ACTIONS.RECEIVE_EDITOR_ITEM_HISTORY,
                    payload: {
                        items: historyItems,
                        modal: true,
                    },
                });
            }

            return Promise.resolve();
        });
    }
);

/**
 * Action to reset the initial values in the editor
 * @param {Object} item - planning or event item from store
 * @param {string} action - The action to take on the item
 */
const reloadEditor = (item, action) => (
    (dispatch, getState) => {
        if (item._id === selectors.forms.currentItemId(getState())) {
            dispatch(self.changeEditorAction(action, false));
        } else if (item._id === selectors.forms.currentItemIdModal(getState())) {
            dispatch(self.changeEditorAction(action, true));
        }
    }
);

/**
 * Action to reset the initial values in the editor
 * @param {object} data - data from unlock notification
 * @param {object} item - item in store
 * @param {string} itemType - type of item, event or planning
 */
const onItemUnlocked = (data, item, itemType) => (
    (dispatch, getState) => {
        const locks = selectors.locks.getLockedItems(getState());
        const itemLock = lockUtils.getLock(item, locks);
        const sessionId = selectors.general.session(getState()).sessionId;

        const editorItemId = selectors.forms.currentItemId(getState());
        const editorModalItemId = selectors.forms.currentItemIdModal(getState());
        const itemId = getItemId(item);

        if (editorItemId === itemId || editorModalItemId === itemId) {
            dispatch(self.changeEditorAction(
                'read',
                editorModalItemId === itemId
            ));
        }

        // If this is the event item currently being edited, show popup notification
        if (itemLock !== null &&
            data.lock_session !== sessionId &&
            itemLock.session === sessionId
        ) {
            const user = selectors.general.users(getState()).find((u) => u._id === data.user);
            const autoSaves = selectors.forms.autosaves(getState());
            const autoSaveInStore = get(autoSaves, `${itemType}['${data.item}']`);

            if (autoSaveInStore) {
                // Delete the changes from the local redux
                dispatch(autosave.removeLocalAutosave(autoSaveInStore));
            }

            dispatch(showModal({
                modalType: MODALS.NOTIFICATION_MODAL,
                modalProps: {
                    title: gettext('Item Unlocked'),
                    body: gettext(`The ${itemType} you were editing was unlocked by`) +
                        ' "' + user.display_name + '"',
                },
            }));

            if (getItemType(item) === ITEM_TYPE.PLANNING && selectors.general.currentWorkspace(getState())
                    === WORKSPACE.AUTHORING) {
                dispatch(self.closePreviewAndEditorForItems([item]));
            }
        }
    }
);

/**
 * Action to fetch data from published planning version
 * @param {object} item - published queue item
 */
const fetchQueueItem = (item) => (
    (dispatch, getState, {api, notify}) => {
        const itemId = get(item, 'item_id');
        const itemType = get(item, 'content_type');
        const itemVersion = get(item, 'item_version');
        const uniqueKey = `${QUEUE_ITEM_PREFIX}--${itemId}--${itemVersion}`;
        let storedItem = null;

        if (itemType === ITEM_TYPE.EVENT) {
            storedItem = get(selectors.events.storedEvents(getState()), `[${uniqueKey}]`, null);
        } else if (itemType === ITEM_TYPE.PLANNING) {
            storedItem = get(selectors.planning.storedPlannings(getState()), `[${uniqueKey}]`, null);
        } else {
            return Promise.reject();
        }
        if (storedItem) {
            return Promise.resolve(storedItem);
        }

        return api('published_planning').query({
            size: 1,
            where: JSON.stringify({$and: [{item_id: itemId}, {version: itemVersion}, {type: itemType}]}),
            embedded: {files: 1},
        })
            .then((results) => {
                if (get(results, '_items.length', 0) > 0) {
                    const publishedItem = get(results, '_items[0].published_item', null);

                    if (publishedItem) {
                        // set the _id as unique key
                        publishedItem._id = uniqueKey;
                        publishedItem.item_id = itemId;
                        if (itemType === ITEM_TYPE.EVENT) {
                            eventUtils.modifyForClient(publishedItem);
                            dispatch(eventsApi.receiveEvents([publishedItem]));
                        } else {
                            planningUtils.modifyForClient(publishedItem);
                            dispatch(planningApi.receivePlannings([publishedItem]));
                        }
                    }
                    return Promise.resolve(publishedItem);
                }
                return Promise.resolve({});
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to get the queue item'))
                );
                return Promise.reject();
            });
    }
);

/**
 * Action to fetched published item and open the preview.
 * @param {object} item - published queue item
 */
const fetchQueueItemAndPreview = (item) => (
    (dispatch) => (
        dispatch(self.fetchQueueItem(item))
            .then(
                (publishedItem) => dispatch(self.openPreview(publishedItem)),
                (error) => Promise.reject(error)
            )
    )
);

/**
 * Action to set the queue item.
 * @param {object} item - published queue item
 */
const onQueueItemChange = (item) => (
    (dispatch) => (
        dispatch({
            type: MAIN.ACTIONS.SET_PUBLISH_QUEUE_ITEM,
            payload: item,
        })
    )
);

/**
 * Action to close the publish queue item preview
 */
const closePublishQueuePreviewOnWorkspaceChange = () => (
    (dispatch, getState) => {
        const previewId = selectors.main.previewId(getState());

        if (isPublishedItemId(previewId)) {
            dispatch(self.closePreview());
        }
    }
);

const spikeItem = (item, post = false) => (
    (dispatch) => dispatch(self.openActionModalFromEditor(
        item,
        gettext('Save changes before spiking ?'),
        (unlockedItem, previousLock, openInEditor, openInModal) => (
            dispatch(self.spikeAfterUnlock(unlockedItem, previousLock, openInEditor, openInModal)
            )
        )
    ))

);

const spikeAfterUnlock = (unlockedItem, previousLock, openInEditor, openInModal) => (
    (dispatch) => {
        const onCloseModal = (updatedItem) => {
            if (!isItemSpiked(updatedItem) && get(previousLock, 'action')) {
                if (openInEditor || openInModal) {
                    return dispatch(
                        self.openForEdit(updatedItem, !openInModal, openInModal)
                    );
                }

                return dispatch(locks.lock(updatedItem, previousLock.action));
            }
        };
        const dispatchCall = getItemType(unlockedItem) === ITEM_TYPE.PLANNING ?
            planningUi.openSpikeModal :
            eventsUi.openSpikeModal;

        return dispatch(dispatchCall(
            unlockedItem,
            post,
            {onCloseModal: (updatedItem) => (onCloseModal(updatedItem))}
        ));
    }
);

/**
 * Action dispatcher that attempts to save and unlock an item
 * @param {object} original - The item to save and unlock
 * @param {object} updates - The item to save and unlock
 * @return Promise
 */
const saveAndUnlockItem = (original, updates, ignoreRecurring = false) => (
    (dispatch, getState, {notify}) => {
        const promise = getItemType(original) === ITEM_TYPE.PLANNING ?
            dispatch(planningUi.save(original, updates)) :
            dispatch(eventsUi.saveWithConfirmation(original, updates, false, ignoreRecurring));

        return promise
            .then((savedItems) => {
                let savedItem = Array.isArray(savedItems) ? savedItems[0] : savedItems;

                savedItem = modifyForClient(savedItem);

                switch (getItemType(original)) {
                case ITEM_TYPE.EVENT:
                    dispatch(
                        eventsApi.receiveEvents([savedItem])
                    );
                    break;
                case ITEM_TYPE.PLANNING:
                    dispatch(
                        planningApi.receivePlannings([savedItem])
                    );
                    break;
                }

                return dispatch(locks.unlock(get(savedItem, '[0]', savedItem)))
                    .then((unlockedItem) => Promise.resolve(unlockedItem))
                    .catch(() => {
                        notify.error(gettext('Could not unlock the item.'));
                        return Promise.reject(savedItem);
                    });
            }, (error) => {
                notify.error(getErrorMessage(error, gettext('Could not save the item.')));
                return Promise.reject(error);
            });
    }
);

const notifyPreconditionFailed = (modal = false) => (
    (dispatch, getState, {notify}) => {
        // eslint-disable-next-line max-len
        notify.error(gettext('Item has changed since it was opened. Please close and reopen the item to continue. Regrettably, your changes cannot be saved.'));
        dispatch(self.changeEditorAction('read', modal));
    }
);


// eslint-disable-next-line consistent-this
const self = {
    unlockAndCancel,
    save,
    unpost,
    post,
    closeEditor,
    filter,
    _filter,
    openConfirmationModal,
    closePreview,
    loadMore,
    search,
    searchAdvancedSearch,
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
    onItemUnlocked,
    fetchQueueItem,
    fetchQueueItemAndPreview,
    onQueueItemChange,
    closePublishQueuePreviewOnWorkspaceChange,
    spikeItem,
    spikeAfterUnlock,
    saveAndUnlockItem,
    openForEdit,
    openEditorAction,
    changeEditorAction,
    notifyPreconditionFailed,
    setUnsetUserInitiatedSearch,
};

export default self;
