import { get, includes } from 'lodash'
import { ASSIGNMENTS } from '../constants/assignments'

const canEditAssignment = (assignment) =>
    (includes([ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED, ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
        ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS],
        get(assignment, 'assigned_to.state')))

const canCompleteAssignment = (assignment) =>
    (get(assignment, 'assigned_to.state') === ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS)

const self = {
    canEditAssignment,
    canCompleteAssignment,
}

export default self
