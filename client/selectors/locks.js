import {createSelector} from 'reselect';
import {get, sortBy, filter} from 'lodash';

import {storedEvents} from './events';
import {storedPlannings} from './planning';
import {currentUserId} from './general';
import {newItemAutosaves} from './forms';

import {lockUtils} from '../utils';

export const getLockedItems = (state) => get(state, 'locks', {
    event: {},
    planning: {},
    recurring: {},
    assignment: {},
});

/** Returns the list of currently locked planning items */
export const getLockedPlannings = createSelector(
    [storedPlannings, currentUserId],
    (plannings, userId) => filter(plannings, (item) => lockUtils.isLockedByUser(item, userId, 'edit'))
);

/** Returns the list of currently locked events */
export const getLockedEvents = createSelector(
    [storedEvents, currentUserId],
    (events, userId) => filter(events, (item) => lockUtils.isLockedByUser(item, userId, 'edit'))
);

export const workqueueItems = createSelector(
    [getLockedEvents, getLockedPlannings, newItemAutosaves],
    (lockedEvents, lockedPlanning, newItems) => (
        sortBy(
            [
                ...lockedEvents,
                ...lockedPlanning,
                ...newItems.event,
                ...newItems.planning,
            ],
            (i) => i.lock_time
        )
    )
);

/** Returns the most recent lock for the current session */
export const getLastSessionLock = (state) => {
    /* Get the planning, event and recurring locks */
    const Locks = Object.assign({}, getLockedItems(state).planning, getLockedItems(state).event,
        getLockedItems(state).recurring);
    /* Get the locks for this session ordered by time */
    const sessionLastLock = sortBy(Object.values(Locks).filter((o) => o.session == state.session.sessionId),
        [(l) => l.time]).reverse()[0];

    return sessionLastLock;
};