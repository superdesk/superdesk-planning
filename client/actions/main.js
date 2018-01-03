import {MAIN, ITEM_TYPE} from '../constants';
import {activeFilter} from '../selectors/main';
import planningUi from './planning/ui';
import eventsUi from './events/ui';
import {locks, showModal} from './';
import {selectAgenda, fetchSelectedAgendaPlannings} from './agenda';
import {getErrorMessage, getItemType} from '../utils';
import {get} from 'lodash';
import {MODALS} from '../constants';

const lockAndEdit = (item) => (
    (dispatch, getState, {notify}) => (
        !get(item, '_id') ?
            dispatch(self.edit(item)) :
            dispatch(locks.lock(item))
                .then((lockedItem) => {
                    // Restore the item type, as the lock endpoint does not provide this
                    lockedItem._type = item._type;

                    dispatch(self.edit(lockedItem));
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
        dispatch(self.cancel());
    }
);

const save = (item, save = true, publish = false) => (
    (dispatch, getState, {notify}) => {
        const itemType = getItemType(item);
        let promise;

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            promise = dispatch(eventsUi.saveAndPublish(item, save, publish));
            break;
        default:
            promise = Promise.reject('Failed to save, could not find the item type!');
            break;
        }

        return promise
            .then((savedItems) => {
                savedItems[0]._type = itemType;

                if (!get(item, '_id')) {
                    dispatch(self.lockAndEdit(savedItems[0]));
                }

                return Promise.resolve(savedItems[0]);
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

const edit = (item) => ({
    type: MAIN.ACTIONS.EDIT,
    payload: item
});

const cancel = () => self.edit(null);

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
    edit,
    cancel,
    preview,
    filter,
    openConfirmationModal,
    closePreview,
};

export default self;
