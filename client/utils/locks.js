import {isNil, get} from 'lodash';
import {ITEM_TYPE} from '../constants';
import {getItemType, eventUtils, planningUtils, assignmentUtils, getItemId} from './index';

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

const getLock = (item, lockedItems) => {
    const itemId = getItemId(item);

    if (!itemId) {
        return null;
    }

    switch (getItemType(item)) {
    case ITEM_TYPE.EVENT:
        return self.getEventLock(item, lockedItems);
    case ITEM_TYPE.PLANNING:
        return self.getPlanningLock(item, lockedItems);
    default:
        if (get(lockedItems.assignment, itemId)) {
            return lockedItems.assignment[itemId];
        }

        break;
    }

    return null;
};

const getEventLock = (item, lockedItems) => {
    const itemId = getItemId(item);

    if (get(lockedItems.recurring, get(item, 'recurrence_id'))) {
        return lockedItems.recurring[item.recurrence_id];
    } else if (get(lockedItems.event, itemId)) {
        return lockedItems.event[itemId];
    }

    return null;
};

const getPlanningLock = (item, lockedItems) => {
    const itemId = getItemId(item);

    if (get(lockedItems.planning, itemId)) {
        return lockedItems.planning[itemId];
    } else if (get(lockedItems.recurring, get(item, 'recurrence_id'))) {
        return lockedItems.recurring[item.recurrence_id];
    } else if (get(lockedItems.event, get(item, 'event_item'))) {
        return lockedItems.event[item.event_item];
    }

    return null;
};

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
