import { get, includes } from 'lodash'
import { ASSIGNMENTS } from '../constants/assignments'
import { isItemLockedInThisSession } from './index'

const canEditAssignment = (assignment, session) => (
    self.isAssignmentInEditableState(assignment) &&
    isItemLockedInThisSession(assignment, session)
)

const isAssignmentInEditableState = (assignment) => (
    (includes([ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED, ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
        ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS],
    get(assignment, 'assigned_to.state')))
)

const canCompleteAssignment = (assignment) =>
    (get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS)

const self = {
    canEditAssignment,
    canCompleteAssignment,
    isAssignmentInEditableState,
}

export default self
