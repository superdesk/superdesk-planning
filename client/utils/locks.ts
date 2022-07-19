import {isNil, get} from 'lodash';

import {
    IEventItem,
    IEventOrPlanningItem,
    ILock,
    ILockedItems,
    IPlanningItem,
    IAssignmentItem,
} from '../interfaces';
import {ITEM_TYPE} from '../constants';
import {getItemType, eventUtils, planningUtils, assignmentUtils, timeUtils} from './index';

const isLockedByUser = (item, userId, action) => (
    !isNil(get(item, 'lock_session')) &&
        get(item, 'lock_user') === userId &&
        (!action || get(item, 'lock_action') === action)
);

const getLockedUser = (item, lockedItems, users) => {
    const lock = self.getLock(item, lockedItems);

    return (lock !== null && Array.isArray(users) && users.length > 0) ?
        users.find((u) => (u._id === lock.user)) || null :
        null;
};

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
        } else if (item.lock_session != null) {
            return {
                action: item.lock_action,
                item_id: item._id,
                item_type: item.type,
                session: item.lock_session,
                time: item.lock_time == null ? undefined : timeUtils.getDateAsString(item.lock_time),
                user: item.lock_user,
            };
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
    } else if (item.lock_session != null) {
        return {
            action: item.lock_action,
            item_id: item._id,
            item_type: item.type,
            session: item.lock_session,
            time: item.lock_time == null ? undefined : timeUtils.getDateAsString(item.lock_time),
            user: item.lock_user,
        };
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
    } else if (item.event_item != null && lockedItems.event[item.event_item] != null) {
        return lockedItems.event[item.event_item];
    } else if (item.lock_session != null) {
        return {
            action: item.lock_action,
            item_id: item._id,
            item_type: item.type,
            session: item.lock_session,
            time: item.lock_time == null ? undefined : timeUtils.getDateAsString(item.lock_time),
            user: item.lock_user,
        };
    }

    return null;
}

const getLockAction = (item, lockedItems) => (
    get(self.getLock(item, lockedItems), 'action')
);

const isItemLockedInThisSession = (item, session, lockedItems = null, ignoreSession = false) => {
    const userId = get(session, 'identity._id');
    const sessionId = get(session, 'sessionId');

    if (get(item, 'lock_user') === userId &&
        (ignoreSession || get(item, 'lock_session') === sessionId)
    ) {
        return true;
    } else if (lockedItems === null) {
        return false;
    }

    const lock = self.getLock(item, lockedItems);

    return !!lock &&
        lock.user === userId &&
        (ignoreSession || lock.session === sessionId) &&
        lock.item_id === item._id;
};

const isLockRestricted = (item, session, lockedItems) => {
    switch (getItemType(item)) {
    case ITEM_TYPE.EVENT:
        return eventUtils.isEventLockRestricted(item, session, lockedItems);
    case ITEM_TYPE.PLANNING:
        return planningUtils.isPlanningLockRestricted(item, session, lockedItems);
    case ITEM_TYPE.ASSIGNMENT:
        return assignmentUtils.isAssignmentLockRestricted(item, session, lockedItems);
    }

    return false;
};

const isItemLocked = (item, lockedItems) => {
    switch (getItemType(item)) {
    case ITEM_TYPE.EVENT:
        return eventUtils.isEventLocked(item, lockedItems);
    case ITEM_TYPE.PLANNING:
        return planningUtils.isPlanningLocked(item, lockedItems);
    case ITEM_TYPE.ASSIGNMENT:
        return assignmentUtils.isAssignmentLocked(item, lockedItems);
    }

    return false;
};

// eslint-disable-next-line consistent-this
const self = {
    getLockedUser,
    getLock,
    getEventLock,
    getPlanningLock,
    getLockAction,
    isLockRestricted,
    isItemLockedInThisSession,
    isLockedByUser,
    isItemLocked,
};

export default self;
