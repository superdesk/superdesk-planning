import {
    IEventItem,
    IEventOrPlanningItem,
    ILock,
    ILockedItems,
    IPlanningItem,
    IAssignmentItem,
    ISession,
} from '../interfaces';
import {IUser} from 'superdesk-api';
import {PLANNING} from '../constants';

function getLockedUser(
    item: IEventOrPlanningItem | IAssignmentItem,
    lockedItems: ILockedItems,
    users: Array<IUser>
): IUser | null {
    const lock = self.getLock(item, lockedItems);

    return (lock !== null && Array.isArray(users) && users.length > 0) ?
        users.find((u) => (u._id === lock.user)) || null :
        null;
}

function getLock(item: IEventOrPlanningItem | IAssignmentItem | null, lockedItems: ILockedItems): ILock | null {
    if (item?._id == null) {
        return null;
    } else if (item.type === 'event') {
        return self.getEventLock(item, lockedItems);
    } else if (item.type === 'planning') {
        return self.getPlanningLock(item, lockedItems);
    } else if (item.type === 'assignment') {
        if (lockedItems.assignment[item._id] != null) {
            return lockedItems.assignment[item._id];
        }
    }

    return null;
}

function getEventLock(item: IEventItem | null, lockedItems: ILockedItems): ILock | null {
    if (item?._id == null) {
        return null;
    } else if (item.recurrence_id != null && lockedItems.recurring[item.recurrence_id] != null) {
        return lockedItems.recurring[item.recurrence_id];
    } else if (lockedItems.event[item._id] != null) {
        return lockedItems.event[item._id];
    }

    return null;
}

function getPlanningLock(item: IPlanningItem | null, lockedItems: ILockedItems): ILock | null {
    if (item?._id == null) {
        return null;
    } else if (lockedItems.planning[item._id] != null) {
        return lockedItems.planning[item._id];
    } else if (item.recurrence_id != null && lockedItems.recurring[item.recurrence_id] != null) {
        return lockedItems.recurring[item.recurrence_id];
    } else if ((item.related_events?.length ?? 0) > 0 && lockedItems.event[item.related_events[0]._id] != null) {
        return lockedItems.event[item.related_events[0]._id];
    }

    return null;
}

function getLockAction(item: IEventOrPlanningItem | IAssignmentItem, lockedItems: ILockedItems): string | null {
    return self.getLock(item, lockedItems)?.action;
}

function isItemLockedInThisSession(
    item: IEventOrPlanningItem | IAssignmentItem,
    session: ISession,
    lockedItems: ILockedItems,
    ignoreSession?: boolean
): boolean {
    const userId = session.identity?._id;
    const sessionId = session.sessionId;
    const lock = self.getLock(item, lockedItems);

    return lock != null &&
        lock.user === userId &&
        (ignoreSession || lock.session === sessionId) &&
        lock.item_id === item._id;
}

function isLockRestricted(
    item: IEventOrPlanningItem | IAssignmentItem,
    session: ISession,
    lockedItems: ILockedItems
): boolean {
    const lock = self.getLock(item, lockedItems);
    const userId = session.identity?._id;
    const sessionId = session.sessionId;

    return lock != null && !(
        lock.user === userId &&
        lock.session === sessionId &&
        lock.item_id === item._id
    );
}

function isItemLocked(item: IEventOrPlanningItem | IAssignmentItem, lockedItems: ILockedItems): boolean {
    return self.getLock(item, lockedItems) != null;
}

function isLockedForAddToPlanning(item: IEventOrPlanningItem, lockedItems: ILockedItems): boolean {
    return self.getLockAction(item, lockedItems) === PLANNING.ITEM_ACTIONS.ADD_TO_PLANNING.lock_action;
}

function getLockedItemIds(lockedItems: ILockedItems): Array<IEventOrPlanningItem['_id']> {
    return [
        ...Object.keys(lockedItems.event).map((lockId) => lockedItems.event[lockId].item_id),
        ...Object.keys(lockedItems.recurring).map((lockId) => lockedItems.recurring[lockId].item_id),
        ...Object.keys(lockedItems.planning).map((lockId) => lockedItems.planning[lockId].item_id),
    ];
}

export function getLockFromItem(item: IEventOrPlanningItem): ILock {
    return {
        item_id: item._id,
        item_type: item.type,
        action: item.lock_action,
        user: item.lock_user,
        session: item.lock_session,
        time: item.lock_time,
    };
}

// eslint-disable-next-line consistent-this
const self = {
    getLockedUser,
    getLock,
    getEventLock,
    getPlanningLock,
    getLockAction,
    isLockRestricted,
    isItemLockedInThisSession,
    isItemLocked,
    isLockedForAddToPlanning,
    getLockedItemIds,
    getLockFromItem,
};

export default self;
