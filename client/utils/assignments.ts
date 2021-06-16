import {get, includes, isNil, find} from 'lodash';
import moment from 'moment';

import {getUserInterfaceLanguage} from 'appConfig';
import {IVocabularyItem} from 'superdesk-api';
import {IAssignmentItem, ISession, IPrivileges, ASSIGNMENT_STATE} from '../interfaces';

import {ASSIGNMENTS, PRIVILEGES} from '../constants';
import * as selectors from '../selectors';

import {gettext, planningUtils, lockUtils, getCreator, getItemInArrayById, isExistingItem} from './index';
import {getVocabularyItemFieldTranslated} from './vocabularies';

const isNotLockRestricted = (assignment, session) => (
    !get(assignment, 'lock_user') ||
        lockUtils.isItemLockedInThisSession(assignment, session)
);

const isTextAssignment = (assignment, contentTypes = []) => {
    const contentType = contentTypes.find((c) => get(c, 'qcode') === get(assignment, 'planning.g2_content_type'));

    return get(contentType, 'content item type', get(contentType, 'qcode')) === 'text';
};

const isPictureAssignment = (assignment, contentTypes = []) => {
    const contentType = contentTypes.find((c) => get(c, 'qcode') === get(assignment, 'planning.g2_content_type'));

    return get(contentType, 'content item type', get(contentType, 'qcode')) === 'picture';
};

const canEditAssignment = (assignment, session, privileges, privilege, contentTypes) => (
    !!privileges[privilege] &&
        self.isNotLockRestricted(assignment, session) &&
        self.isAssignmentInEditableState(assignment) &&
        !self.isPictureAssignment(assignment, contentTypes)
);

const canRemoveAssignment = (assignment, session, privileges, privilege) => (
    !!privileges[privilege] &&
        self.isNotLockRestricted(assignment, session) &&
        self.isAssignmentInEditableState(assignment)
);

const canStartWorking = (assignment, session, privileges, contentTypes) => (
    !!privileges[PRIVILEGES.ARCHIVE] &&
        !get(assignment, 'lock_user') &&
        self.isTextAssignment(assignment, contentTypes) &&
        get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED &&
        (
            !get(assignment, 'assigned_to.user') ||
            assignment.assigned_to.user === get(session, 'identity._id')
        ) &&
        !isAssignedToProvider(assignment)
);

const canFulfilAssignment = (assignment, session, privileges) => (
    !!privileges[PRIVILEGES.ARCHIVE] &&
        isNotLockRestricted(assignment, session) &&
        get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED
);

const isAssignmentInEditableState = (assignment) => (
    (includes([ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED, ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
        ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS],
    get(assignment, 'assigned_to.state')))
);

function canCompleteAssignment(
    assignment: IAssignmentItem,
    session: ISession,
    privileges: IPrivileges
): boolean {
    return !!privileges[PRIVILEGES.ARCHIVE] &&
        self.isNotLockRestricted(assignment, session) &&
        (
            assignment.assigned_to?.state === ASSIGNMENT_STATE.IN_PROGRESS ||
            (
                [
                    ASSIGNMENT_STATE.SUBMITTED,
                    ASSIGNMENT_STATE.ASSIGNED,
                    ASSIGNMENT_STATE.IN_PROGRESS
                ].includes(assignment.assigned_to?.state) &&
                assignment.scheduled_update_id != null
            )
        );
}

const canConfirmAvailability = (assignment, session, privileges, contentTypes) => (
    !!privileges[PRIVILEGES.ARCHIVE] &&
        self.isNotLockRestricted(assignment, session) &&
        !self.isTextAssignment(assignment, contentTypes) &&
        (
            get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED ||
            get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED
        )
);

const canRevertAssignment = (assignment, session, privileges) => (
    !!privileges[PRIVILEGES.ARCHIVE] &&
        self.isNotLockRestricted(assignment, session) &&
        get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.COMPLETED
);

const assignmentHasContent = (assignment) => (
    get(assignment, 'item_ids.length', 0) > 0
);

const isDue = (assignment) => (
    get(assignment, 'planning.scheduled') &&
        moment().isAfter(moment(assignment.planning.scheduled)) &&
        [
            ASSIGNMENTS.WORKFLOW_STATE.COMPLETED,
            ASSIGNMENTS.WORKFLOW_STATE.CANCELLED,
        ].indexOf(get(assignment, 'assigned_to.state')) < 0
);

const isAssignedToProvider = (assignment) => (
    get(assignment, 'assigned_to.coverage_provider.qcode')
);

const getContactLabel = (assignment) => (
    isAssignedToProvider(assignment) ?
        gettext('Assigned Provider') :
        gettext('Coverage Contact')
);

const getAssignmentActions = (assignment, session, privileges, lockedItems, contentTypes, callBacks) => {
    if (!isExistingItem(assignment) || lockUtils.isLockRestricted(assignment, session, lockedItems)) {
        return [];
    }

    let actions = [];

    Object.keys(callBacks).forEach((callBackName) => {
        switch (callBackName) {
        case ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.actionName:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.START_WORKING,
                        callback: callBacks[callBackName].bind(null, assignment),
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.actionName:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY,
                        callback: callBacks[callBackName].bind(null, assignment),
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.actionName:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.COMPLETE,
                        callback: callBacks[callBackName].bind(null, assignment),
                        label: get(assignment, 'scheduled_update_id') ?
                            gettext('Mark as completed') :
                            ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.label,
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.actionName:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.REASSIGN,
                        callback: callBacks[callBackName].bind(null, assignment),
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.REMOVE.actionName:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.REMOVE,
                        callback: callBacks[callBackName].bind(null, assignment),
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.actionName:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE,
                        callback: callBacks[callBackName].bind(null, assignment),
                    });
            break;

        case ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY.actionName:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY,
                        callback: callBacks[callBackName].bind(null, assignment),
                    });
            break;


        case ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY.actionName:
            callBacks[callBackName] &&
                    actions.push({
                        ...ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY,
                        callback: callBacks[callBackName].bind(null, assignment),
                    });
            break;
        }
    });

    return getAssignmentItemActions(assignment, session, privileges, contentTypes, actions);
};

const getAssignmentItemActions = (assignment, session, privileges, contentTypes, actions) => {
    let itemActions = [];
    let key = 1;

    const actionsValidator = {
        [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.actionName]: () =>
            self.canEditAssignment(assignment, session, privileges, PRIVILEGES.ARCHIVE, contentTypes),
        [ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.actionName]: () =>
            self.canCompleteAssignment(assignment, session, privileges),
        [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.actionName]: () =>
            self.canEditAssignment(assignment, session, privileges, PRIVILEGES.ARCHIVE, contentTypes),
        [ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.actionName]: () =>
            self.canStartWorking(assignment, session, privileges, contentTypes),
        [ASSIGNMENTS.ITEM_ACTIONS.REMOVE.actionName]: () =>
            self.canRemoveAssignment(assignment, session, privileges, PRIVILEGES.PLANNING_MANAGEMENT),
        [ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.actionName]: () =>
            self.assignmentHasContent(assignment),
        [ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY.actionName]: () =>
            self.canConfirmAvailability(assignment, session, privileges, contentTypes),
        [ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY.actionName]: () =>
            self.canRevertAssignment(assignment, session, privileges),
    };

    actions.forEach((action) => {
        if (actionsValidator[action.actionName] &&
                !actionsValidator[action.actionName]()) {
            return;
        }

        itemActions.push({
            ...action,
            key: `${action.actionName}-${key}`,
        });

        key++;
    });

    return itemActions;
};

const getAssignmentGroupsByStates = (groups, states) => {
    if (get(states, 'length', 0) < 1) {
        return [];
    }

    const groupKeys = [];

    const processState = (state) => {
        groups.forEach((groupKey) => {
            if (groupKeys.indexOf(groupKey) < 0 &&
                ASSIGNMENTS.LIST_GROUPS[groupKey].states.indexOf(state) > -1
            ) {
                groupKeys.push(groupKey);
            }
        });
    };

    states.forEach(processState);

    return groupKeys;
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
        !lockUtils.isItemLockedInThisSession(assignment, session, locks);

const getAssignmentInfo = (assignment, users, desks) => {
    const assignedTo = get(assignment, 'assigned_to');
    const createdBy = getCreator(assignment, 'original_creator', users);
    const updatedBy = getCreator(assignment, 'version_creator', users);
    const creationDate = get(assignment, '_created');
    const updatedDate = get(assignment, '_updated');
    const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
        users.find((user) => user._id === updatedBy);

    const assignedUser = getItemInArrayById(users, get(assignedTo, 'user'));
    const assignedDesk = getItemInArrayById(desks, get(assignedTo, 'desk'));
    const deskAssignor = getItemInArrayById(users, get(assignedTo, 'assignor_desk'));
    const userAssignor = getItemInArrayById(users, get(assignedTo, 'assignor_user'));
    const deskAssignorName = get(deskAssignor, 'display_name') ||
        get(deskAssignor, 'name') || '-';
    const userAssignorName = get(userAssignor, 'display_name') ||
        get(userAssignor, 'name') || '-';
    const assignedDateDesk = get(assignedTo, 'assigned_date_desk');
    const assignedDateUser = get(assignedTo, 'assigned_date_user');

    const assignedUserName = get(assignedUser, 'display_name') ||
        get(assignedUser, 'name') ||
        '-';
    const assignedDeskName = get(assignedDesk, 'name') || '-';
    const coverageProvider = get(assignedTo, 'coverage_provider.name');

    return {
        assignedTo,
        createdBy,
        updatedBy,
        creationDate,
        updatedDate,
        versionCreator,
        assignedUser,
        assignedDesk,
        deskAssignor,
        userAssignor,
        deskAssignorName,
        userAssignorName,
        assignedDateDesk,
        assignedDateUser,
        assignedUserName,
        assignedDeskName,
        coverageProvider,
    };
};

/**
 * Action dispatcher to get the id of the currently selected desk
 * This could either be from the workspace dropdown, or if this is a custom workspace,
 * then return the id of the desk dropdown provided in the Assignments subnav
 * @param {Object} desks - The Desks service from client-core
 * @param {Object} state - The redux store's state
 * @returns {String} - Desk Id
 */
const getCurrentSelectedDeskId = (desks, state) => {
    if (get(desks, 'userDesks.length', 0) < 1) {
        return null;
    } else if (!desks.activeDeskId || !find(desks.userDesks, {_id: desks.activeDeskId})) {
        return selectors.getSelectedDeskId(state);
    }

    return desks.activeDeskId;
};

/**
 * Action dispatcher to get the currently selected desk
 * This could either be from the workspace dropdown, or if this is a custom workspace,
 * then return the desk dropdown provided in the Assignments subnav
 * @param {Object} desks - The Desks service from client-core
 * @param {Object} state - The redux store's state
 * @returns {Object} - Desk
 */
const getCurrentSelectedDesk = (desks, state) => {
    const deskId = self.getCurrentSelectedDeskId(desks, state);

    return get(desks.deskLookup, deskId) || null;
};

export function getAssignmentTypeInfo(assignment: IAssignmentItem, contentTypes: Array<IVocabularyItem>) {
    const g2ContentType = assignment.planning?.g2_content_type;
    const contentTypeName = getVocabularyItemFieldTranslated(
        contentTypes.find(
            (type) => type.qcode === g2ContentType
        ),
        'name',
        assignment.planning?.language || getUserInterfaceLanguage()
    );
    const tooltip = gettext('Article Type: {{type}}', {type: contentTypeName});
    const className = planningUtils.getCoverageIcon(
        planningUtils.getCoverageContentType(assignment, contentTypes) || g2ContentType,
        assignment
    );

    return {tooltip, className};
}

// eslint-disable-next-line consistent-this
const self = {
    isNotLockRestricted,
    canEditAssignment,
    canCompleteAssignment,
    canRemoveAssignment,
    isAssignmentInEditableState,
    getAssignmentActions,
    canStartWorking,
    canFulfilAssignment,
    getAssignmentGroupsByStates,
    canEditDesk,
    assignmentHasContent,
    isAssignmentLockRestricted,
    getAssignmentInfo,
    isTextAssignment,
    isPictureAssignment,
    canConfirmAvailability,
    canRevertAssignment,
    isAssignmentLocked,
    isDue,
    getCurrentSelectedDeskId,
    getCurrentSelectedDesk,
    isAssignedToProvider,
    getContactLabel,
};

export default self;
