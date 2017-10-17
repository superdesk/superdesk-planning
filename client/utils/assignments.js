import { get, includes } from 'lodash'
import { ASSIGNMENTS } from '../constants/assignments'

const isAssignmentCancelled = (assigment) =>
    (get(assigment, 'assigned_to.state') === 'cancelled')

const canEditAssignment = (assignment) =>
    (includes([ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED, ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED],
        get(assignment, 'assigned_to.state')))

const self = {
    isAssignmentCancelled,
    canEditAssignment,
}

export default self
