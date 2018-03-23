import {isNil, get} from 'lodash';
import {ITEM_TYPE} from '../constants';
import {getItemType, eventUtils, planningUtils, assignmentUtils} from './index';

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
    if (isNil(item) || !get(item, '_id')) {
        return null;
    }

    switch (getItemType(item)) {
    case ITEM_TYPE.EVENT:
        return self.getEventLock(item, lockedItems);
    case ITEM_TYPE.PLANNING:
        return self.getPlanningLock(item, lockedItems);
    default:
        if (item._id in lockedItems.assignment) {
            return lockedItems.assignment[item._id];
        }

        break;
    }

    return null;
};

const getEventLock = (item, lockedItems) => {
    if (get(item, 'recurrence_id') in lockedItems.recurring) {
        return lockedItems.recurring[item.recurrence_id];
    } else if (item._id in lockedItems.event) {
        return lockedItems.event[item._id];
    }

    return null;
};

const getPlanningLock = (item, lockedItems) => {
    if (item._id in lockedItems.planning) {
        return lockedItems.planning[item._id];
    } else if (get(item, 'recurrence_id') in lockedItems.recurring) {
        return lockedItems.recurring[item.recurrence_id];
    } else if (get(item, 'event_item') in lockedItems.event) {
        return lockedItems.event[item.event_item];
    }

    return null;
};

const isItemLockedInThisSession = (item, session) => (
    get(item, 'lock_user') === get(session, 'identity._id') &&
        get(item, 'lock_session') === get(session, 'sessionId')
);

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

// eslint-disable-next-line consistent-this
const self = {
    getLockedUser,
    getLock,
    getEventLock,
    getPlanningLock,
    isLockRestricted,
    isItemLockedInThisSession,
    isLockedByUser,
};

export default self;
