import * as selectors from '../selectors';
import {LOCKS, ITEM_TYPE, WORKSPACE, PLANNING} from '../constants';
import {planning, events, assignments} from './index';
import {lockUtils, getItemType, gettext} from '../utils';

/**
 * Action Dispatcher to load all Event and Planning locks
 * Then send them to the lock reducer for processing and storage
 */
const loadAllLocks = () => (
    (dispatch) => (
        Promise.all([
            dispatch(events.api.queryLockedEvents()),
            dispatch(planning.api.queryLockedPlanning()),
        ])
            .then((data) => {
                const payload = {
                    events: data[0],
                    plans: data[1],
                };

                dispatch({
                    type: LOCKS.ACTIONS.RECEIVE,
                    payload: payload,
                });
                return Promise.resolve(payload);
            }, (error) => Promise.reject(error))
    )
);

/**
 * Action Dispatcher to load Assignment locks
 * Then send them to the lock reducer for processing and storage
 */
const loadAssignmentLocks = () => (
    (dispatch) => (
        dispatch(assignments.api.queryLockedAssignments())
            .then((data) => {
                const payload = {assignments: data};

                dispatch({
                    type: LOCKS.ACTIONS.RECEIVE,
                    payload: payload,
                });
                return Promise.resolve(payload);
            }, (error) => Promise.reject(error))
    )
);

/**
 * Action Dispatcher to release the lock an a chain of Events and/or Planning items
 * It retrieves the lock from the Redux store for the item provided
 * and calls the appropriate unlock method on the item that is actually locked
 * @param {object} item - The Event or Planning item chain to unlock
 */
const unlock = (item) => (
    (dispatch, getState, {notify}) => {
        const locks = selectors.locks.getLockedItems(getState());
        const currentLock = lockUtils.getLock(item, locks);

        if (currentLock === null) {
            const errorMessage = gettext('Failed to unlock the item. Lock not found!');

            notify.error(errorMessage);
            return Promise.reject(errorMessage);
        }

        switch (currentLock.item_type) {
        case 'planning':
            return dispatch(planning.api.unlock({_id: currentLock.item_id}));
        case 'event':
            return dispatch(events.api.unlock({_id: currentLock.item_id}));
        }
    }
);

const lock = (item, lockAction = 'edit') => (
    (dispatch, getState, {notify}) => {
        const itemType = getItemType(item);
        const currentWorkspace = selectors.general.currentWorkspace(getState());

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            return dispatch(events.api.lock(item, lockAction));
        case ITEM_TYPE.PLANNING:
            return dispatch(planning.api.lock(
                item,
                currentWorkspace === WORKSPACE.AUTHORING ?
                    PLANNING.ITEM_ACTIONS.ADD_TO_PLANNING.lock_action :
                    lockAction
            ));
        }

        const errorMessage = gettext('Failed to lock the item, could not determine item type!');

        notify.error(errorMessage);
        return Promise.reject(errorMessage);
    }
);

const unlockThenLock = (item) => (
    (dispatch) => (
        dispatch(self.unlock(item))
            .then(
                (unlockedItem) => dispatch(self.lock(unlockedItem)),
                (error) => Promise.reject(error)
            )
    )
);

// eslint-disable-next-line consistent-this
const self = {
    lock,
    unlock,
    loadAllLocks,
    loadAssignmentLocks,
    unlockThenLock,
};

export default self;
