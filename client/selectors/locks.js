import {createSelector} from 'reselect';
import {get, sortBy, filter} from 'lodash';

import {storedEvents} from './events';
import {storedPlannings} from './planning';
import {currentUserId} from './general';

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
    [getLockedEvents, getLockedPlannings],
    (lockedEvents, lockedPlanning) => (
        sortBy(
            [
                ...lockedEvents,
                ...lockedPlanning,
            ],
            (i) => i.lock_time
        )
    )
);
