import {createSelector} from 'reselect';
import {get, sortBy} from 'lodash';

import {
    IPlanningAppState,
    ILockedItems,
    ISession,
    IEventOrPlanningItem,
    IPlanningItem,
    IEventItem
} from '../interfaces';
import {storedEvents} from './events';
import {storedPlannings} from './planning';
import {currentUserId} from './general';
import {newItemAutosaves} from './forms';

const EMPTY_LOCKS = {};
const eventLocks = (state: IPlanningAppState) => state.locks?.event ?? EMPTY_LOCKS;
const planningLocks = (state: IPlanningAppState) => state.locks?.planning ?? EMPTY_LOCKS;
const recurringLocks = (state: IPlanningAppState) => state.locks?.recurring ?? EMPTY_LOCKS;
const assignmentLocks = (state: IPlanningAppState) => state.locks?.assignment ?? EMPTY_LOCKS;

export const getLockedItems = createSelector<
    IPlanningAppState,
    ILockedItems['event'],
    ILockedItems['planning'],
    ILockedItems['recurring'],
    ILockedItems['assignment'],
    ILockedItems
>(
    [eventLocks, planningLocks, recurringLocks, assignmentLocks],
    (event, planning, recurring, assignment) => ({
        event,
        planning,
        recurring,
        assignment,
    })
);

export const getItemIdsEditLockedByCurrentUser = createSelector<
    IPlanningAppState,
    ILockedItems,
    ISession['identity']['_id'],
    Array<IEventOrPlanningItem['_id']>
>(
    [getLockedItems, currentUserId],
    (lockedItems, userId) => (
        [
            ...Object.keys(lockedItems.event)
                .filter((lockId) => (
                    lockedItems.event[lockId].user === userId &&
                        lockedItems.event[lockId].action === 'edit'
                ))
                .map((lockId) => lockedItems.event[lockId].item_id),
            ...Object.keys(lockedItems.recurring)
                .filter((lockId) => (
                    lockedItems.recurring[lockId].user === userId &&
                        lockedItems.recurring[lockId].action === 'edit'
                ))
                .map((lockId) => lockedItems.recurring[lockId].item_id),
            ...Object.keys(lockedItems.planning)
                .filter((lockId) => (
                    lockedItems.planning[lockId].user === userId &&
                        lockedItems.planning[lockId].action === 'edit'
                ))
                .map((lockId) => lockedItems.planning[lockId].item_id),
        ]
    )
);

export const getLockedPlannings = createSelector<
    IPlanningAppState,
    {[key: string]: IPlanningItem},
    Array<IPlanningItem['_id']>,
    Array<IPlanningItem>
>(
    [storedPlannings, getItemIdsEditLockedByCurrentUser],
    (plannings, lockedItemIds) => (
        Object.keys(plannings)
            .filter((planningId) => lockedItemIds.includes(planningId))
            .map((planningId) => plannings[planningId])
    )
);

export const getLockedEvents = createSelector<
    IPlanningAppState,
    {[key: string]: IEventItem},
    Array<IEventItem['_id']>,
    Array<IEventItem>
>(
    [storedEvents, getItemIdsEditLockedByCurrentUser],
    (events, lockedItemIds) => (
        Object.keys(events)
            .filter((eventId) => lockedItemIds.includes(eventId))
            .map((eventId) => events[eventId])
    )
);

export const workqueueItems = createSelector<
    IPlanningAppState,
    Array<IEventItem>,
    Array<IPlanningItem>,
    {
        event: Array<IEventItem>,
        planning: Array<IPlanningItem>
    },
    Array<IEventOrPlanningItem>
>(
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
export const getLastSessionLock = (state, excludeEdits = true) => {
    const {
        event: eventLocks,
        planning: planningLocks,
        recurring: recurringLocks,
    } = getLockedItems(state);

    const locks = sortBy(
        /* Get the planning, event and recurring locks */
        Object.values({
            ...planningLocks,
            ...eventLocks,
            ...recurringLocks,
        }).filter((lock) => (
            // Filter locks for this session, excluding edits
            lock.session === state.session.sessionId &&
                (!excludeEdits || lock.action !== 'edit')
        )),
        // Sort by the lock time, newest lock first
        'time'
    ).reverse();

    // And finally return the newest lock or null
    return get(locks, '[0]') || null;
};
