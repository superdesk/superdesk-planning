import * as selectors from '../../selectors'
import assignments from './index'
import { get } from 'lodash'
import planning from '../planning'
import { ASSIGNMENTS } from '../../constants'
import { getLock } from '../../utils'
import { hideModal, showModal } from '../index'

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
 * WS Action when a Assignment item is updated
 * @param {object} _e - Event object
 * @param {object} data - Assignment, User, Desk IDs
 */
const onAssignmentUpdated = (_e, data) => (
    (dispatch, getState) => {
        const currentDesk = selectors.getCurrentDeskId(getState())
        const planningItem = _getPlanningItemOnAssignmentUpdate(data,
            selectors.getStoredPlannings(getState()))

        if (planningItem) {
            dispatch(planning.api.receivePlannings([planningItem]))
        }

        if (currentDesk) {
            if (currentDesk === data.assigned_desk || currentDesk === data.original_assigned_desk) {
                dispatch(assignments.ui.fetch())
            }

            if (get(data, 'assignment_state') === ASSIGNMENTS.WORKFLOW_STATE.COMPLETED) {
                // Assignment was completed on editor but context was a different desk
                return dispatch(assignments.api.fetchAssignmentById(data.item, false))
                    .then((assignmentInStore) => {
                        assignmentInStore = {
                            ...assignmentInStore,
                            lock_action: null,
                            lock_user: null,
                            lock_session: null,
                            lock_time: null,
                        }
                        assignmentInStore.assigned_to.state = ASSIGNMENTS.WORKFLOW_STATE.COMPLETED

                        dispatch({
                            type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
                            payload: { assignment: assignmentInStore },
                        })
                    })
            }
        }

        return Promise.resolve()
    }
)

const _getPlanningItemOnAssignmentUpdate = (data, plans) => {
    if (get(data, 'planning')) {
        let planningItem = { ...get(plans, data.planning) }

        if (get(planningItem, '_id')) {
            let coverages = get(planningItem, 'coverages') || []
            let coverage = coverages.find((cov) => cov.coverage_id === data.coverage)
            if (coverage) {
                if (data.assigned_user) {
                    coverage.assigned_to.user = data.assigned_user
                }

                if (data.assigned_desk) {
                    coverage.assigned_to.desk = data.assigned_desk
                }

                if (get(data, 'assignment_state') === ASSIGNMENTS.WORKFLOW_STATE.COMPLETED) {
                    coverage.assigned_to.state = data.assignment_state
                }

                return planningItem
            }
        }
    }
}

const onAssignmentLocked = (_e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            return dispatch(assignments.api.fetchAssignmentById(data.item, false))
            .then((assignmentInStore) => {
                assignmentInStore = {
                    ...assignmentInStore,
                    lock_action: data.lock_action,
                    lock_user: data.user,
                    lock_session: data.lock_session,
                    lock_time: data.lock_time,
                    _etag: data.etag,
                }

                dispatch({
                    type: ASSIGNMENTS.ACTIONS.LOCK_ASSIGNMENT,
                    payload: { assignment: assignmentInStore },
                })

                return Promise.resolve(assignmentInStore)
            })
        }

        return Promise.resolve()
    }
)

/**
 * WS Action when a Planning item gets unlocked
 * If the Planning Item is unlocked don't fetch it. Just update the store directly by a dispatch.
 * This is done because backend Eve caching is returning old objects on subsequent fetch if locking
 * is applied.
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onAssignmentUnlocked = (_e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            return dispatch(assignments.api.fetchAssignmentById(data.item, false))
            .then((assignmentInStore) => {
                const locks = selectors.getLockedItems(getState())
                const itemLock = getLock(assignmentInStore, locks)
                const sessionId = selectors.getSessionDetails(getState()).sessionId

                assignmentInStore = {
                    ...assignmentInStore,
                    _id: data.item,
                    lock_action: null,
                    lock_user: null,
                    lock_session: null,
                    lock_time: null,
                    _etag: data.etag,
                }

                dispatch({
                    type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
                    payload: { assignment: assignmentInStore },
                })

                // If this is the planning item currently being edited, show popup notification
                if (itemLock !== null &&
                    data.lock_session !== sessionId &&
                    itemLock.session === sessionId
                ) {
                    const user =  selectors.getUsers(getState()).find((u) => u._id === data.user)
                    dispatch(hideModal())
                    dispatch(showModal({
                        modalType: 'NOTIFICATION_MODAL',
                        modalProps: {
                            title: 'Item Unlocked',
                            body: 'The assignment item you were editing was unlocked by "' +
                                user.display_name + '"',
                        },
                    }))
                }

                return Promise.resolve()
            })
        }
    }
)

const self = {
    onAssignmentCreated,
    onAssignmentUpdated,
    onAssignmentLocked,
    onAssignmentUnlocked,
}

// Map of notification name and Action Event to execute
self.events = {
    'assignments:created': () => (self.onAssignmentCreated),
    'assignments:lock': () => (self.onAssignmentLocked),
    'assignments:unlock': () => (self.onAssignmentUnlocked),
    'assignments:updated': () => (self.onAssignmentUpdated),
    'assignments:completed': () => (self.onAssignmentUpdated),
}

export default self
