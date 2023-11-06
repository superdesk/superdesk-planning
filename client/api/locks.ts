import {
    ILock,
    ILockedItems,
    IPlanningAPI,
    IWebsocketMessageData,
    IAssignmentOrPlanningItem,
    IFeaturedPlanningLock,
} from '../interfaces';
import {planningApi, superdeskApi} from '../superdeskApi';

import {EVENTS, LOCKS, PLANNING, WORKSPACE, ASSIGNMENTS} from '../constants';

import featuredPlanning from '../actions/planning/featuredPlanning';
import {lockUtils, getErrorMessage, eventUtils, planningUtils, isExistingItem} from '../utils';
import {currentWorkspace as getCurrentWorkspace} from '../selectors/general';
import {getLockedItems} from '../selectors/locks';

function loadLockedItems(types?: Array<'events_and_planning' | 'featured_planning' | 'assignments'>): Promise<void> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;
    let url = 'planning_locks';

    if ((types?.length ?? 0) > 0) {
        url += `?repos=${types.join(',')}`;
    }

    return superdeskApi.dataApi.queryRawJson<ILockedItems & {featured?: ILock}>(url).then(
        (locks) => {
            const {dispatch} = planningApi.redux.store;

            dispatch({
                type: LOCKS.ACTIONS.RECEIVE,
                payload: locks,
            });

            // If `featured_planning` lock was retrieved, then update it's lock now
            if (types == null || types.includes('featured_planning')) {
                if (locks.featured?.user != null) {
                    dispatch(featuredPlanning.setLockUser(locks.featured.user, locks.featured.session));
                } else {
                    dispatch(featuredPlanning.setUnlocked());
                }
            }

            // Make sure that all items that are locked are loaded into the store
            return planningApi.combined.searchGetAll({
                item_ids: lockUtils.getLockedItemIds(locks),
                only_future: false,
                include_killed: true,
                spike_state: 'draft',
                exclude_rescheduled_and_cancelled: false,
                include_associated_planning: true,
            }).then(
                (items) => {
                    dispatch({
                        type: EVENTS.ACTIONS.ADD_EVENTS,
                        payload: items.filter((item) => item.type === 'event'),
                    });
                    dispatch({
                        type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                        payload: items.filter((item) => item.type === 'planning'),
                    });
                },
                (error) => {
                    notify.error(getErrorMessage(error, gettext('Failed to load locked items')));

                    return Promise.reject(error);
                }
            );
        },
        (error) => {
            notify.error(getErrorMessage(error, gettext('Failed to load item locks')));

            return Promise.reject(error);
        }
    );
}

function setItemAsLocked(data: IWebsocketMessageData['ITEM_LOCKED']): void {
    const {dispatch} = planningApi.redux.store;

    dispatch({
        type: LOCKS.ACTIONS.SET_ITEM_AS_LOCKED,
        payload: data,
    });
}

function setItemAsUnlocked(data: IWebsocketMessageData['ITEM_UNLOCKED']): void {
    const {dispatch} = planningApi.redux.store;

    dispatch({
        type: LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED,
        payload: data,
    });
}

function getLockResourceName(itemType: IAssignmentOrPlanningItem['type']) {
    switch (itemType) {
    case 'event':
        return 'events';
    case 'planning':
        return 'planning';
    case 'assignment':
        return 'assignments';
    }
}

function lockItem<T extends IAssignmentOrPlanningItem>(item: T, action?: string): Promise<T> {
    const {dispatch, getState} = planningApi.redux.store;
    const resource = getLockResourceName(item.type);
    const endpoint = `${resource}/${item._id}/lock`;
    let lockAction = action;

    if (lockAction == null) {
        const currentWorkspace = getCurrentWorkspace(getState());

        lockAction = currentWorkspace === WORKSPACE.AUTHORING ?
            PLANNING.ITEM_ACTIONS.ADD_TO_PLANNING.lock_action :
            'edit';
    }

    // @ts-ignore
    return superdeskApi.dataApi.create<T>(endpoint, {lock_action: lockAction})
        .then((lockedItem) => {
            // On lock, file object in the item is lost, so replace it from original item
            if (lockedItem.type !== 'assignment' && item.type !== 'assignment') {
                lockedItem.files = item.files;
            } if (lockedItem.type === 'event') {
                eventUtils.modifyForClient(lockedItem);
            } else if (lockedItem.type === 'planning') {
                planningUtils.modifyForClient(lockedItem);
            }

            locks.setItemAsLocked({
                item: lockedItem._id,
                type: lockedItem.type,
                event_item: lockedItem.type === 'planning' ? lockedItem.event_item : undefined,
                recurrence_id: lockedItem.type !== 'assignment' ? lockedItem.recurrence_id : undefined,
                etag: lockedItem._etag,
                user: lockedItem.lock_user,
                lock_session: lockedItem.lock_session,
                lock_action: lockedItem.lock_action,
                lock_time: lockedItem.lock_time,
            });

            if (lockedItem.type === 'event') {
                dispatch({
                    type: EVENTS.ACTIONS.LOCK_EVENT,
                    payload: {event: lockedItem},
                });
            } else if (lockedItem.type === 'planning') {
                dispatch({
                    type: PLANNING.ACTIONS.LOCK_PLANNING,
                    payload: {plan: lockedItem},
                });
            } else if (lockedItem.type === 'assignment') {
                dispatch({
                    type: ASSIGNMENTS.ACTIONS.LOCK_ASSIGNMENT,
                    payload: {assignment: lockedItem},
                });
            }

            return lockedItem;
        }, (error) => {
            const {gettext} = superdeskApi.localization;
            const {notify} = superdeskApi.ui;

            notify.error(getErrorMessage(error, gettext('Failed to lock item')));

            return Promise.reject(error);
        });
}

function getItemById<T extends IAssignmentOrPlanningItem>(
    itemId: T['_id'],
    itemType: T['type']
): Promise<T> {
    // TODO: Figure out why this fails ts checks
    switch (itemType) {
    case 'event':
        return planningApi.events.getById(itemId);
    case 'planning':
        return planningApi.planning.getById(itemId);
    case 'assignment':
        return planningApi.assignments.getById(itemId);
    }
}

function lockItemById<T extends IAssignmentOrPlanningItem>(
    itemId: T['_id'],
    itemType: T['type'],
    action: string
): Promise<T> {
    return getItemById(itemId, itemType).then((item) => locks.lockItem(item, action));
}

function unlockItem<T extends IAssignmentOrPlanningItem>(item: T, reloadLocksIfNotFound: boolean = true): Promise<T> {
    if (!isExistingItem(item)) {
        const autosaveDeletePromise = item.type === 'assignment' ?
            Promise.resolve() :
            planningApi.autosave.deleteById(item.type, item._id);

        if (item.type === 'event' && item._planning_item != null) {
            return Promise.all([
                autosaveDeletePromise,
                unlockItemById(item._planning_item, 'planning'),
            ]).then((promiseResponses) => (
                promiseResponses[1]
            ));
        }

        return autosaveDeletePromise.then(() => item);
    }

    const {dispatch, getState} = planningApi.redux.store;
    const lockedItems = getLockedItems(getState());
    const currentLock = lockUtils.getLock(item, lockedItems);

    if (currentLock == null) {
        if (reloadLocksIfNotFound) {
            // The lock was not found in the local store
            // Reload the list of locks now, and attempt to unlock again
            return loadLockedItems().then(() => unlockItem(item, false));
        } else {
            // The lock was still not found for this item
            // It's possible that it is not actually locked
            return Promise.resolve(item);
        }
    }

    const lockedItemId = currentLock.item_id;
    const resource = getLockResourceName(currentLock.item_type);
    const endpoint = `${resource}/${lockedItemId}/unlock`;

    return superdeskApi.dataApi.create<T>(endpoint, {})
        .then((unlockedItem) => {
            if (unlockedItem.type === 'event') {
                eventUtils.modifyForClient(unlockedItem);
            } else if (unlockedItem.type === 'planning') {
                planningUtils.modifyForClient(unlockedItem);
            }

            locks.setItemAsUnlocked({
                item: unlockedItem._id,
                type: unlockedItem.type,
                event_item: unlockedItem.type === 'planning' ? unlockedItem.event_item : undefined,
                recurrence_id: unlockedItem.type !== 'assignment' ? unlockedItem.recurrence_id : undefined,
                etag: unlockedItem._etag,
                from_ingest: false,
                user: unlockedItem.lock_user,
                lock_session: unlockedItem.lock_session,
            });

            if (unlockedItem.type === 'event') {
                dispatch({
                    type: EVENTS.ACTIONS.UNLOCK_EVENT,
                    payload: {event: unlockedItem},
                });
            } else if (unlockedItem.type === 'planning') {
                dispatch({
                    type: PLANNING.ACTIONS.UNLOCK_PLANNING,
                    payload: {plan: unlockedItem},
                });
            } else if (unlockedItem.type === 'assignment') {
                dispatch({
                    type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
                    payload: {assignment: unlockedItem},
                });
            }

            return unlockedItem;
        }, (error) => {
            const {gettext} = superdeskApi.localization;
            const {notify} = superdeskApi.ui;

            notify.error(getErrorMessage(error, gettext('Failed to unlock item')));

            return Promise.reject(error);
        });
}

function unlockItemById<T extends IAssignmentOrPlanningItem>(itemId: T['_id'], itemType: T['type']): Promise<T> {
    return getItemById(itemId, itemType).then((item) => unlockItem(item));
}

function unlockThenLockItem<T extends IAssignmentOrPlanningItem>(item: T, action: string): Promise<T> {
    return unlockItem(item).then(() => (lockItem(item, action)));
}

function lockFeaturedPlanning(): Promise<void> {
    return superdeskApi.dataApi.create<IFeaturedPlanningLock>('planning_featured_lock', {})
        .then((lockDetails) => {
            const {dispatch} = planningApi.redux.store;

            dispatch(featuredPlanning.setLockUser(lockDetails.lock_user, lockDetails.lock_session));
        });
}

function unlockFeaturedPlanning(): Promise<void> {
    return superdeskApi.dataApi.create('planning_featured_unlock', {})
        .then(() => {
            const {dispatch} = planningApi.redux.store;

            dispatch(featuredPlanning.setUnlocked());
        });
}

export const locks: IPlanningAPI['locks'] = {
    loadLockedItems: loadLockedItems,
    setItemAsLocked: setItemAsLocked,
    setItemAsUnlocked: setItemAsUnlocked,
    lockItem: lockItem,
    lockItemById: lockItemById,
    unlockItem: unlockItem,
    unlockItemById: unlockItemById,
    unlockThenLockItem: unlockThenLockItem,
    lockFeaturedPlanning: lockFeaturedPlanning,
    unlockFeaturedPlanning: unlockFeaturedPlanning,
};
