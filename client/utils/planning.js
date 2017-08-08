import { getItemState } from './index'
import { WORKFLOW_STATE } from '../constants/index'

const canSavePlanning = (planning, event) => (
    getItemState(planning) !== WORKFLOW_STATE.SPIKED &&
        getItemState(event) !== WORKFLOW_STATE.SPIKED
)

const canPublishPlanning = (planning, event) => {
    const planState = getItemState(planning)
    const eventState = getItemState(event)
    return (planState === WORKFLOW_STATE.IN_PROGRESS || planState === WORKFLOW_STATE.KILLED) &&
        eventState !== WORKFLOW_STATE.SPIKED
}

const canUnpublishPlanning = (planning, event) => {
    const planState = getItemState(planning)
    const eventState = getItemState(event)
    return planState === WORKFLOW_STATE.PUBLISHED &&
        eventState !== WORKFLOW_STATE.SPIKED
}

const canEditPlanning = (
    planning,
    event,
    planningManagementPrivilege,
    lockedInThisSession,
    lockedUser
) => (
    getItemState(planning) !== WORKFLOW_STATE.SPIKED &&
        getItemState(event) !== WORKFLOW_STATE.SPIKED &&
        planningManagementPrivilege &&
        !lockedInThisSession &&
        !lockedUser
)

const self = {
    canSavePlanning,
    canPublishPlanning,
    canUnpublishPlanning,
    canEditPlanning,
}

export default self
