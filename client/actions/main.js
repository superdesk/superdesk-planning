import {MAIN, ITEM_TYPE} from '../constants';
import {activeFilter, previewItem, lastRequestParams} from '../selectors/main';
import planningUi from './planning/ui';
import eventsUi from './events/ui';
import {locks, showModal} from './';
import {selectAgenda, fetchSelectedAgendaPlannings} from './agenda';
import {getErrorMessage, getItemType, lockUtils, gettext} from '../utils';
import {MODALS} from '../constants';
import eventsPlanningUi from './eventsPlanning/ui';
import {get, omit, isEmpty} from 'lodash';

import * as selectors from '../selectors';

const lockAndEdit = (item) => (
    (dispatch, getState, {notify}) => {
        const state = getState();
        const lockedItems = selectors.locks.getLockedItems(state);
        let promise;

        // If it is an existing item and the item is not locked
        // then lock the item, otherwise return the existing item
        if (get(item, '_id') && !lockUtils.getLock(item, lockedItems)) {
            promise = dispatch(locks.lock(item));
        } else {
            promise = Promise.resolve(item);
        }

        return promise.then((lockedItem) => {
            // If the item being edited is currently opened in the Preview panel
            // then close the preview panel
            if (get(previewItem(getState()), '_id') === lockedItem._id) {
                dispatch(self.closePreview());
            }

            dispatch(self.openEditor(lockedItem));
            return Promise.resolve(lockedItem);
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to lock the item')
            );

            return Promise.reject(error);
        });
    }
);

const unlockAndCancel = (item) => (
    (dispatch, getState) => {
        // If the item exists and is locked in this session
        // then unlock the item
        if (item && lockUtils.isItemLockedInThisSession(item, selectors.getSessionDetails(getState()))) {
            dispatch(locks.unlock(item));
        }
        dispatch(self.closeEditor());
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

const save = (item, save = true, publish = false) => (
    (dispatch, getState, {notify}) => {
        const itemType = getItemType(item);
        let promise;

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            promise = dispatch(eventsUi.saveWithConfirmation(item, save, publish));
            break;
        case ITEM_TYPE.PLANNING:
            promise = dispatch(planningUi.saveAndPublishPlanning(item, save, publish));
            break;
        default:
            promise = Promise.reject(gettext('Failed to save, could not find the item type!'));
            break;
        }

        return promise
            .then((savedItems) => {
                const savedItem = Array.isArray(savedItems) ? savedItems[0] : savedItems;

                savedItem._type = itemType;

                if (!get(item, '_id')) {
                    return dispatch(self.lockAndEdit(savedItem));
                }

                return Promise.resolve(savedItem);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to save the item'))
                );

                return Promise.reject(error);
            });
    }
);

const unpublish = (item) => (
    (dispatch, getState, {notify}) => {
        const itemType = getItemType(item);

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            return dispatch(eventsUi.unpublish(item));
        case ITEM_TYPE.PLANNING:
            return dispatch(planningUi.unpublish(item));
        }

        const errMessage = gettext('Failed to unpublish, could not find the item type!');

        notify.error(errMessage);
        return Promise.reject(errMessage);
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

const openEditor = (item) => ({
    type: MAIN.ACTIONS.OPEN_EDITOR,
    payload: item
});

const closeEditor = () => ({
    type: MAIN.ACTIONS.CLOSE_EDITOR
});

const preview = (item) => ({
    type: MAIN.ACTIONS.PREVIEW,
    payload: item
});

const closePreview = () => ({type: MAIN.ACTIONS.CLOSE_PREVIEW});

const filter = (ftype = null) => (
    (dispatch, getState, {$timeout, $location}) => {
        let filterType = ftype;
        let promise = Promise.resolve();

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

        // Update the url (deep linking)
        $timeout(() => $location.search('filter', filterType));

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

        return promise;
    }
);

const loadMore = (filterType) => (
    (dispatch, getState, {notify}) => {
        if (!filterType) {
            const errMessage = gettext('Cannot load more data.');

            notify.error(errMessage);
            return Promise.reject(errMessage);
        }

        if (filterType === MAIN.FILTERS.EVENTS) {
            return dispatch(eventsUi.loadMore());
        } else if (filterType === MAIN.FILTERS.PLANNING) {
            return dispatch(planningUi.loadMore());
        } else if (filterType === MAIN.FILTERS.COMBINED) {
            return dispatch(eventsPlanningUi.loadMore());
        }

        return Promise.resolve();
    }
);

const search = (searchText) => (
    (dispatch, getState, {notify}) => {
        let filterType = activeFilter(getState());

        if (!filterType) {
            const errMessage = gettext('Cannot search as filter type is not selected.');

            notify.error(errMessage);
            return Promise.reject(errMessage);
        }

        const previousParams = lastRequestParams(getState());
        const params = {
            ...previousParams,
            page: 1,
            fulltext: searchText
        };

        if (filterType === MAIN.FILTERS.EVENTS) {
            return dispatch(eventsUi.fetchEvents(params));
        } else if (filterType === MAIN.FILTERS.PLANNING) {
            return dispatch(fetchSelectedAgendaPlannings(params));
        } else if (filterType === MAIN.FILTERS.COMBINED) {
            return dispatch(eventsPlanningUi.fetch(params));
        }

        return Promise.resolve();
    }
);

// eslint-disable-next-line consistent-this
const self = {
    lockAndEdit,
    unlockAndCancel,
    save,
    unpublish,
    openCancelModal,
    openEditor,
    closeEditor,
    preview,
    filter,
    openConfirmationModal,
    closePreview,
    unlockAndCloseEditor,
    history,
    loadMore,
    search
};

export default self;
