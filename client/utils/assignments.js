import { get, includes } from 'lodash'
import { ASSIGNMENTS } from '../constants/assignments'
import { isItemLockedInThisSession } from './index'

const canEditAssignment = (assignment, session) => (
    self.isAssignmentInEditableState(assignment) &&
    (!get(assignment, 'lock_user') ||
    isItemLockedInThisSession(assignment, session))
)

const isAssignmentInEditableState = (assignment) => (
    (includes([ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED, ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
        ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS],
    get(assignment, 'assigned_to.state')))
)

const canCompleteAssignment = (assignment, session) =>
    (get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS &&
        !get(assignment, 'lock_user') || isItemLockedInThisSession(assignment, session)
)

const isAssignmentInUse = (assignment) => (
    (includes([ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED, ASSIGNMENTS.WORKFLOW_STATE.COMPLETED,
        ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS],
    get(assignment, 'assigned_to.state')))
)

const getAssignmentItemActions = (assignment, session, actions) => {
    let itemActions = []
    let key = 1

    const actionsValidator = {
        [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label]: () =>
            canEditAssignment(assignment, session),
        [ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.label]: () =>
            canCompleteAssignment(assignment, session),
    }

    actions.forEach((action) => {
        if (actionsValidator[action.label] &&
                !actionsValidator[action.label](assignment, session)) {
            return
        }

        itemActions.push({
            ...action,
            key: `${action.label}-${key}`,
        })

        key++
    })

    return itemActions
}

const self = {
    canEditAssignment,
    canCompleteAssignment,
    isAssignmentInEditableState,
    getAssignmentItemActions,
    isAssignmentInUse,
}

export default self
