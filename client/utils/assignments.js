import { get } from 'lodash'

const isAssignmentCancelled = (assigment) =>
    (get(assigment, 'assigned_to.state') === 'cancelled')

const self = { isAssignmentCancelled }

export default self
