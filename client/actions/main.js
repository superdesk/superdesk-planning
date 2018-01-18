import {MAIN, ITEM_TYPE} from '../constants';
import {activeFilter, previewItem} from '../selectors/main';
import planningUi from './planning/ui';
import eventsUi from './events/ui';
import {locks, showModal} from './';
import {selectAgenda, fetchSelectedAgendaPlannings} from './agenda';
import {getErrorMessage, getItemType} from '../utils';
import {get} from 'lodash';
import {MODALS} from '../constants';

import * as selectors from '../selectors';

const lockAndEdit = (item) => (
    (dispatch, getState, {notify}) => (
        !get(item, '_id') ?
            dispatch(self.openEditor(item)) && Promise.resolve(item) :
            dispatch(locks.lock(item))
                .then((lockedItem) => {
                    // Restore the item type, as the lock endpoint does not provide this
                    lockedItem._type = item._type;

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
                })
    )
);

const unlockAndCancel = (item) => (
    (dispatch) => {
        if (item) {
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
            promise = Promise.reject('Failed to save, could not find the item type!');
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
                    getErrorMessage(error, 'Failed to save the item')
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

        notify.error('Failed to unpublish, could not find the item type!');
        return Promise.reject('Failed to unpublish, could not find the item type!');
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

        if (filterType === null) {
            filterType = $location.search().filter ||
                activeFilter(getState()) ||
                MAIN.FILTERS.COMBINED;
        }

        dispatch({
            type: MAIN.ACTIONS.FILTER,
            payload: filterType,
        });

        // Update the url (deep linking)
        $timeout(() => $location.search('filter', filterType));

        if (filterType === MAIN.FILTERS.EVENTS) {
            dispatch(planningUi.clearList());
            return dispatch(eventsUi.fetchEvents({
                fulltext: JSON.parse(
                    $location.search().searchEvent || '{}'
                ).fulltext,
            }));
        } else if (filterType === MAIN.FILTERS.PLANNING) {
            dispatch(eventsUi.clearList());
            const searchAgenda = $location.search().agenda;

            if (searchAgenda) {
                return dispatch(selectAgenda(searchAgenda));
            }

            return dispatch(
                fetchSelectedAgendaPlannings()
            );
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
};

export default self;
