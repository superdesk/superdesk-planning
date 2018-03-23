import {get, includes, isNil} from 'lodash';
import {ASSIGNMENTS, PRIVILEGES, PLANNING} from '../constants';
import {lockUtils} from './index';

const canEditAssignment = (assignment, session, privileges) => (
    !!privileges[PRIVILEGES.PLANNING_MANAGEMENT] &&
    self.isAssignmentInEditableState(assignment) &&
    (!get(assignment, 'lock_user') ||
    lockUtils.isItemLockedInThisSession(assignment, session))
);

const canStartWorking = (assignment, session, privileges) => (
    !!privileges[PRIVILEGES.ARCHIVE] &&
    (!get(assignment, 'assigned_to.user') ||
    assignment.assigned_to.user === get(session, 'identity._id')) &&
    get(assignment, 'planning.g2_content_type') === PLANNING.G2_CONTENT_TYPE.TEXT &&
    get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED &&
    !get(assignment, 'lock_user')
);

const isAssignmentInEditableState = (assignment) => (
    (includes([ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED, ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
        ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS],
    get(assignment, 'assigned_to.state')))
);

const canCompleteAssignment = (assignment, session, privileges) => (
    !!privileges[PRIVILEGES.ARCHIVE] &&
        get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS &&
        (!get(assignment, 'lock_user') || lockUtils.isItemLockedInThisSession(assignment, session))
);

const canConfirmAvailability = (assignment, session, privileges) => (
    get(assignment, 'planning.g2_content_type') !== PLANNING.G2_CONTENT_TYPE.TEXT &&
    (get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED ||
    get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED) &&
    (!get(assignment, 'lock_user') || lockUtils.isItemLockedInThisSession(assignment, session))
);

const canRevertAssignment = (assignment, session, privileges) => (
    get(assignment, 'planning.g2_content_type') !== PLANNING.G2_CONTENT_TYPE.TEXT &&
    get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.COMPLETED &&
    (!get(assignment, 'lock_user') || lockUtils.isItemLockedInThisSession(assignment, session))
);

const isAssignmentInUse = (assignment) => (
    (includes([ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED, ASSIGNMENTS.WORKFLOW_STATE.COMPLETED,
        ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS],
    get(assignment, 'assigned_to.state')))
);

const assignmentHasContent = (assignment) => (
    get(assignment, 'item_ids.length', 0) > 0
);

const canRemoveAssignment = (assignment, session, privileges) => (
    canEditAssignment(assignment, session, privileges) &&
        get(assignment, 'assigned_to.state') !== ASSIGNMENTS.WORKFLOW_STATE.COMPLETED
);

const getAssignmentActions = (assignment, session, privileges, lockedItems, callBacks) => {
    if (!get(assignment, '_id') || lockUtils.isLockRestricted(assignment, session, lockedItems)) {
        return [];
    }

    let actions = [];

    Object.keys(callBacks).forEach((callBackName) => {
        switch (callBackName) {
        case ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.label:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.START_WORKING,
                        callback: callBacks[callBackName].bind(null, assignment)
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY,
                        callback: callBacks[callBackName].bind(null, assignment)
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.label:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.COMPLETE,
                        callback: callBacks[callBackName].bind(null, assignment)
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.REASSIGN,
                        callback: callBacks[callBackName].bind(null, assignment)
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.REMOVE.label:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.REMOVE,
                        callback: callBacks[callBackName].bind(null, assignment)
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.label:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE,
                        callback: callBacks[callBackName].bind(null, assignment)
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY.label:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY,
                        callback: callBacks[callBackName].bind(null, assignment)
                    });
            break;


        case ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY.label:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY,
                        callback: callBacks[callBackName].bind(null, assignment)
                    });
            break;
        }
    });

    return getAssignmentItemActions(assignment, session, privileges, actions);
};

const getAssignmentItemActions = (assignment, session, privileges, actions) => {
    let itemActions = [];
    let key = 1;

    const actionsValidator = {
        [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label]: () =>
            canEditAssignment(assignment, session, privileges),
        [ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.label]: () =>
            canCompleteAssignment(assignment, session, privileges),
        [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label]: () =>
            canEditAssignment(assignment, session, privileges),
        [ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.label]: () =>
            canStartWorking(assignment, session, privileges),
        [ASSIGNMENTS.ITEM_ACTIONS.REMOVE.label]: () =>
            canRemoveAssignment(assignment, session, privileges),
        [ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.label]: () =>
            assignmentHasContent(assignment),
        [ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY.label]: () =>
            canConfirmAvailability(assignment, session, privileges),
        [ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY.label]: () =>
            canRevertAssignment(assignment, session, privileges),
    };

    actions.forEach((action) => {
        if (actionsValidator[action.label] &&
                !actionsValidator[action.label](assignment, session)) {
            return;
        }

        itemActions.push({
            ...action,
            key: `${action.label}-${key}`,
        });

        key++;
    });

    return itemActions;
};

const getAssignmentsInListGroups = (assignments) => {
    let listGroups = {
        todo: [],
        inProgress: [],
        completed: [],
    };

    assignments.forEach((a) => {
        if (includes(ASSIGNMENTS.LIST_GROUPS.TODO.states, a.assigned_to.state)) {
            listGroups.todo.push(a._id);
        } else if (includes(ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.states, a.assigned_to.state)) {
            listGroups.inProgress.push(a._id);
        } else {
            listGroups.completed.push(a._id);
        }
    });

    return listGroups;
};

const getAssignmentGroupByStates = (states = []) => {
    if (get(states, 'length') > 0) {
        const state = states[0];

        if (ASSIGNMENTS.LIST_GROUPS.TODO.states.indexOf(state) > -1) {
            return ASSIGNMENTS.LIST_GROUPS.TODO;
        }

        if (ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.states.indexOf(state) > -1) {
            return ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS;
        }

        if (ASSIGNMENTS.LIST_GROUPS.COMPLETED.states.indexOf(state) > -1) {
            return ASSIGNMENTS.LIST_GROUPS.COMPLETED;
        }
    }
};

const canEditDesk = (assignment) => {
    const state = get(assignment, 'assigned_to.state');

    return state !== ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED &&
        state !== ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS;
};

const isAssignmentLocked = (assignment, locks) =>
    !isNil(assignment) && (
        assignment._id in locks.assignment
    );

const isAssignmentLockRestricted = (assignment, session, locks) =>
    isAssignmentLocked(assignment, locks) &&
        !lockUtils.isItemLockedInThisSession(assignment, session);


// eslint-disable-next-line consistent-this
const self = {
    canEditAssignment,
    canCompleteAssignment,
    isAssignmentInEditableState,
    getAssignmentActions,
    isAssignmentInUse,
    canStartWorking,
    getAssignmentsInListGroups,
    getAssignmentGroupByStates,
    canRemoveAssignment,
    canEditDesk,
    assignmentHasContent,
    isAssignmentLockRestricted,
};

export default self;
