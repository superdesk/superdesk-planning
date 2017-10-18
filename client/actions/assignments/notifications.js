import * as selectors from '../../selectors'
import assignments from './index'
import { get } from 'lodash'
import planning from '../planning'

/**
 * WS Action when a new Assignment item is created
 * @param {object} _e - Event object
 * @param {object} data - Assignment, User, Desk IDs
 */
const onAssignmentCreated = (_e, data) => (
    (dispatch, getState) => {
        const currentDesk = selectors.getCurrentDeskId(getState())
        if (currentDesk &&
            (currentDesk === data.assigned_desk || currentDesk === data.original_assigned_desk)) {
            return dispatch(assignments.ui.fetch())
        }

        return Promise.resolve()
    }
)

/**
 * WS Action when a new Assignment item is updated
 * @param {object} _e - Event object
 * @param {object} data - Assignment, User, Desk IDs
 */
const onAssignmentUpdated = (_e, data) => (
    (dispatch, getState) => {
        const currentDesk = selectors.getCurrentDeskId(getState())

        if (get(data, 'planning')) {
            const plans = selectors.getStoredPlannings(getState())
            let planningItem = { ...get(plans, data.planning) }

            if (get(planningItem, '_id')) {
                let coverages = get(planningItem, 'coverages') || []
                let coverage = coverages.find((cov) => cov.coverage_id === data.coverage)
                if (coverage) {
                    coverage.assigned_to.user = data.assigned_user
                    coverage.assigned_to.desk = data.assigned_desk

                    if (data.assignment_state) {
                        coverage.assigned_to.state = data.assignment_state
                    }

                    dispatch(planning.api.receivePlannings([planningItem]))
                }
            }
        }

        if (currentDesk &&
            (currentDesk === data.assigned_desk || currentDesk === data.original_assigned_desk)) {
            return dispatch(assignments.ui.fetch())
        }

        return Promise.resolve()
    }
)

const self = {
    onAssignmentCreated,
    onAssignmentUpdated,
}

// Map of notification name and Action Event to execute
self.events = {
    'assignments:created': () => (self.onAssignmentCreated),
    'assignments:updated': () => (self.onAssignmentUpdated),
    'assignments:completed': () => (self.onAssignmentUpdated),
}

export default self
